(() => {
 const SUPABASE_URL='https://dcnzcdkptpuwbmogrhes.supabase.co';
 const SUPABASE_KEY='sb_publishable_2tMBuyEYfg0Zm08_zCggIg_Mtr9_I32';
 const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 const $=id=>document.getElementById(id);
 let mode='signup';
 function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);$('message').style.display='block'}
 function busy(id,on){$(id).disabled=on;$(id).textContent=on?'Aguarde...':(id==='signup-button'?'Criar conta e empresa':id==='login-button'?'Entrar no HoraCerta':'Concluir cadastro da empresa')}
 function showMode(next){mode=next;$('signup-form').classList.toggle('hidden',next!=='signup');$('login-form').classList.toggle('hidden',next!=='login');$('company-complete').classList.add('hidden');$('tab-signup').classList.toggle('active',next==='signup');$('tab-login').classList.toggle('active',next==='login');$('heading').textContent=next==='signup'?'Crie sua empresa':'Acesse sua conta';$('subheading').textContent=next==='signup'?'Cadastre sua conta de proprietário para configurar o ambiente da sua empresa.':'Entre com o e-mail e a senha da sua conta HoraCerta.';$('message').style.display='none'}
 async function finishCompany(user, fallback={}) {
   const {data:members,error:memberError}=await db.from('hc_memberships').select('company_id,role').eq('user_id',user.id).eq('active',true).eq('role','owner').limit(1);
   if(memberError) throw memberError;
   if(members?.length){location.href='/';return}
   const meta=user.user_metadata||{};
   const companyName=fallback.company_name||meta.company_name;
   const legal=fallback.legal_name||meta.legal_name||'';
   const cnpj=fallback.cnpj||meta.cnpj||'';
   if(!companyName){$('signup-form').classList.add('hidden');$('login-form').classList.add('hidden');$('company-complete').classList.remove('hidden');$('heading').textContent='Finalize sua empresa';$('subheading').textContent='Sua conta já existe. Informe os dados da empresa para abrir seu painel.';return}
   const {error}=await db.rpc('hc_register_company',{company_name:companyName,company_legal_name:legal,company_cnpj:cnpj});
   if(error) throw error;
   location.href='/';
 }
 $('tab-signup').onclick=()=>showMode('signup');$('tab-login').onclick=()=>showMode('login');
 $('signup-form').onsubmit=async e=>{e.preventDefault();busy('signup-button',true);try{
   const payload={company_name:$('company-name').value.trim(),legal_name:$('legal-name').value.trim(),cnpj:$('cnpj').value.trim()};
   const {data,error}=await db.auth.signUp({email:$('signup-email').value.trim(),password:$('signup-password').value,options:{emailRedirectTo:window.location.origin+'/conta.html',data:{...payload,owner_name:$('owner-name').value.trim()}}});
   if(error)throw error;
   if(data.session&&data.user){await finishCompany(data.user,payload)}
   else message('Conta criada. Confirme seu e-mail pelo link enviado e depois entre nesta página para concluir o cadastro da empresa.');
 }catch(err){message(err.message||'Não foi possível criar a conta.',true)}finally{busy('signup-button',false)}};
 $('login-form').onsubmit=async e=>{e.preventDefault();busy('login-button',true);try{const {data,error}=await db.auth.signInWithPassword({email:$('login-email').value.trim(),password:$('login-password').value});if(error)throw error;await finishCompany(data.user)}catch(err){message(err.message||'Não foi possível entrar.',true)}finally{busy('login-button',false)}};
 $('complete-company-button').onclick=async()=>{busy('complete-company-button',true);try{const {data:{user},error}=await db.auth.getUser();if(error||!user)throw error||new Error('Entre novamente na sua conta.');await finishCompany(user,{company_name:$('complete-company-name').value.trim(),legal_name:$('complete-legal-name').value.trim(),cnpj:$('complete-cnpj').value.trim()})}catch(err){message(err.message||'Não foi possível cadastrar a empresa.',true)}finally{busy('complete-company-button',false)}};
 db.auth.getSession().then(async({data:{session}})=>{if(session){try{await finishCompany(session.user)}catch(err){message(err.message||'Erro ao verificar sua empresa.',true)}}});
})();