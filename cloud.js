(() => {
 const SUPABASE_URL='https://dcnzcdkptpuwbmogrhes.supabase.co';
 const SUPABASE_KEY='sb_publishable_2tMBuyEYfg0Zm08_zCggIg_Mtr9_I32';
 const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 const $=id=>document.getElementById(id);
 let companyId=null, schedules=[], cloudReady=false;
 const punchLabels={entry:'Entrada',break_start:'Saída para intervalo',break_end:'Retorno do intervalo',exit:'Saída'};
 const toLabel=t=>punchLabels[t]||t;
 const toType=t=>({'Entrada':'entry','Saída para intervalo':'break_start','Retorno do intervalo':'break_end','Saída':'exit'}[t]||'entry');
 function localParts(iso){const d=new Date(iso);const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {date:o.year+'-'+o.month+'-'+o.day,time:o.hour+':'+o.minute}}
 async function loadCloud(){
   const {data:{session}}=await db.auth.getSession();
   if(!session){location.replace('/conta.html');return}
   const {data:membership,error:me}=await db.from('hc_memberships').select('company_id,role').eq('user_id',session.user.id).eq('active',true).eq('role','owner').limit(1).maybeSingle();
   if(me)throw me;if(!membership){location.replace('/conta.html');return}
   companyId=membership.company_id;
   const [{data:company,error:ce},{data:emps,error:ee},{data:rows,error:pe},{data:sc,error:se}]=await Promise.all([
    db.from('hc_companies').select('id,name').eq('id',companyId).single(),
    db.from('hc_employees').select('*').eq('company_id',companyId).order('created_at'),
    db.from('hc_punches').select('*').eq('company_id',companyId).order('occurred_at'),
    db.from('hc_schedules').select('*').eq('company_id',companyId).eq('active',true)
   ]);
   if(ce||ee||pe||se)throw ce||ee||pe||se;
   schedules=sc||[];
   state.company=company.name;
   state.employees=(emps||[]).map(e=>({id:e.id,name:e.full_name,code:e.registration_code,role:e.job_title||'Funcionário',department:e.department||'Operações',schedule:schedules.find(s=>s.id===e.schedule_id)?.name||'A definir',scheduleId:e.schedule_id,faceStatus:'not_enrolled'}));
   state.records=(rows||[]).map(r=>{const p=localParts(r.occurred_at),e=state.employees.find(x=>x.id===r.employee_id);return {id:r.id,employeeId:r.employee_id,date:p.date,time:p.time,type:toLabel(r.punch_type),origin:r.source==='terminal'?'Terminal da empresa':'Painel administrativo'}});
   cloudReady=true;renderAll();$('company-name-side').textContent=company.name;const ownerName=session.user.user_metadata?.owner_name||session.user.email||'Proprietário';const firstName=ownerName.split(/\s+/)[0];const heading=document.querySelector('#view-overview h1');if(heading)heading.innerHTML='Bem-vindo(a), '+String(firstName).replace(/[&<>\"']/g,'')+' <span class=\"wave\">.</span>';const userLabel=document.querySelector('.user-mini b');if(userLabel)userLabel.textContent=ownerName;const userRole=document.querySelector('.user-mini small');if(userRole)userRole.textContent='Proprietário';document.querySelectorAll('.user-avatar,.top-avatar').forEach(el=>el.textContent=ownerName.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase());const live=document.querySelector('.live-indicator');if(live)live.innerHTML='<i></i> Banco conectado';document.querySelectorAll('.demo-banner').forEach(el=>el.classList.add('hidden'));
   const settingsCompany=$('settings-company');if(settingsCompany)settingsCompany.value=company.name;
   document.querySelectorAll('.integration-row').forEach(el=>{if(el.textContent.includes('Supabase')){el.querySelector('small').textContent='Banco de dados conectado e sincronizado';el.querySelector('.integration-status').textContent='Conectado'}});
   document.querySelectorAll('.settings-hint').forEach(el=>el.textContent='Dados sincronizados com a nuvem da sua empresa.');
 }
 async function reloadCloud(){const {data:emps,error:ee}=await db.from('hc_employees').select('*').eq('company_id',companyId).order('created_at');const {data:rows,error:pe}=await db.from('hc_punches').select('*').eq('company_id',companyId).order('occurred_at');if(ee||pe)throw ee||pe;state.employees=(emps||[]).map(e=>({id:e.id,name:e.full_name,code:e.registration_code,role:e.job_title||'Funcionário',department:e.department||'Operações',schedule:schedules.find(s=>s.id===e.schedule_id)?.name||'A definir',scheduleId:e.schedule_id,faceStatus:'not_enrolled'}));state.records=(rows||[]).map(r=>{const p=localParts(r.occurred_at);return {id:r.id,employeeId:r.employee_id,date:p.date,time:p.time,type:toLabel(r.punch_type),origin:'Terminal da empresa'}});renderAll()}
 $('logout-btn').onclick=async()=>{await db.auth.signOut();location.href='/conta.html'};
 $('employee-form').onsubmit=async e=>{e.preventDefault();if(!cloudReady)return;const code=$('new-code').value.trim().toUpperCase();if(state.employees.some(x=>x.code===code)){showToast('Esta matrícula já está cadastrada.');return}const selectedSchedule=schedules.find(s=>s.name===$('new-schedule').value);const payload={company_id:companyId,registration_code:code,full_name:$('new-name').value.trim(),email:$('new-email').value.trim()||null,phone:$('new-phone').value.trim()||null,job_title:$('new-role').value.trim(),department:$('new-department').value,schedule_id:selectedSchedule?.id||null};const btn=$('employee-form').querySelector('button[type="submit"],button:not([type])');if(btn)btn.disabled=true;try{const {data:created,error}=await db.from('hc_employees').insert(payload).select('id').single();if(error)throw error;if(faceCaptured&&window.HoraCertaFace?.descriptor){const {data:{session}}=await db.auth.getSession();const {data:faceResult,error:faceError}=await db.functions.invoke('hc-face',{body:{action:'enroll',company_id:companyId,employee_id:created.id,descriptor:window.HoraCertaFace.descriptor,consent:true}});if(faceError||!faceResult?.ok)throw faceError||new Error(faceResult?.error||'Não foi possível cadastrar o rosto');}await reloadCloud();closeEmployeeModal();showToast(faceCaptured?'Funcionário e rosto cadastrados com segurança.':'Funcionário salvo. Cadastre o rosto para habilitar o ponto facial.')}catch(err){showToast('Erro ao cadastrar: '+err.message)}finally{if(btn)btn.disabled=false}};
 $('save-settings').onclick=async()=>{const name=$('settings-company').value.trim();const {error}=await db.from('hc_companies').update({name,updated_at:new Date().toISOString()}).eq('id',companyId);if(error){showToast('Erro ao salvar: '+error.message);return}state.company=name;$('company-name-side').textContent=name;showToast('Dados da empresa atualizados na nuvem.')};
 $('export-records').onclick=()=>{const lines=[['Funcionário','Matrícula','Data','Horário','Tipo','Origem'],...state.records.map(r=>{const e=employee(r.employeeId);return [e?.name||'',e?.code||'',r.date,r.time,r.type,r.origin]})];const csv='\ufeff'+lines.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='horacerta-marcacoes.csv';a.click();URL.revokeObjectURL(a.href)};
 window.HoraCertaCloud={db,get companyId(){return companyId},reload:reloadCloud,ready:()=>cloudReady,toType};
 loadCloud().catch(err=>{console.error(err);showToast('Falha ao carregar dados: '+err.message)});
})();