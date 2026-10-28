import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SUPABASE_URL = 'https://dcnzcdkptpuwbmogrhes.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2tMBuyEYfg0Zm08_zCggIg_Mtr9_I32';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DEFAULT_WHATSAPP = '5562993150343';
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(Number(value)||0);
const sampleProducts = [
 {id:'demo-1',name:'Brigadeiros tradicionais',description:'Cremosos, feitos com carinho e finalizados com granulado.',category:'Doces',price:3.5,original_price:4.5,stock:20,image_url:'',active:true},
 {id:'demo-2',name:'Biscoitos amanteigados',description:'Levinhos, delicados e perfeitos para acompanhar um café.',category:'Biscoitos',price:12,original_price:null,stock:12,image_url:'',active:true},
 {id:'demo-3',name:'Caixinha especial',description:'Uma seleção de docinhos para presentear alguém especial.',category:'Kits',price:25,original_price:30,stock:8,image_url:'',active:true}
];
let products = [];
let adminProducts = [];
let cart = {};
let selectedCategory = 'Todos';
let session = null;
let editingId = null;
let whatsappNumber = localStorage.getItem('docesdagi_whatsapp') || DEFAULT_WHATSAPP;
let useDemo = false;

$('year').textContent = new Date().getFullYear();
$('whatsapp-number').value = whatsappNumber;

function notice(message) {
 const box = $('admin-notice');
 box.textContent = message;
 box.classList.remove('hidden');
}
function toast(message) {
 const old = document.querySelector('.toast');
 if(old) old.remove();
 const box = document.createElement('div');
 box.className = 'toast';
 box.append(document.createTextNode(message));
 const close = document.createElement('button');
 close.textContent = '×';
 close.onclick = () => box.remove();
 box.append(close);
 document.body.append(box);
 setTimeout(() => box.remove(), 6000);
}
function goStore() {
 history.pushState({}, '', '/');
 $('admin-view').classList.add('hidden');
 $('storefront').classList.remove('hidden');
 document.querySelector('.site-header').classList.remove('hidden');
 document.querySelector('.site-footer').classList.remove('hidden');
 window.scrollTo(0,0);
 loadProducts();
}
function showAdmin() {
 $('storefront').classList.add('hidden');
 document.querySelector('.site-header').classList.add('hidden');
 document.querySelector('.site-footer').classList.add('hidden');
 $('cart-backdrop').classList.add('hidden');
 $('admin-view').classList.remove('hidden');
 $('admin-notice').classList.add('hidden');
 if(session) {
  $('login-form').classList.add('hidden');
  $('admin-dashboard').classList.remove('hidden');
  $('admin-logout').classList.remove('hidden');
  loadAdminProducts();
 } else {
  $('login-form').classList.remove('hidden');
  $('admin-dashboard').classList.add('hidden');
  $('admin-logout').classList.add('hidden');
 }
}
async function loadProducts() {
 $('products').innerHTML = '<div class="empty-state">Carregando as delícias...</div>';
 const {data,error} = await supabase.from('products').select('*').eq('active',true).order('created_at',{ascending:false});
 if(error) {
  console.error('Erro ao carregar produtos:', error.message);
  products = sampleProducts;
  useDemo = true;
 } else {
  products = data || [];
  useDemo = false;
 }
 renderCategories();
 renderProducts();
 renderCart();
}
function renderCategories() {
 const cats = ['Todos', ...new Set(products.map(p=>p.category).filter(Boolean))];
 if(!cats.includes(selectedCategory)) selectedCategory = 'Todos';
 $('categories').innerHTML = '';
 cats.forEach(cat=>{
  const b = document.createElement('button');
  b.className = 'category' + (cat===selectedCategory?' active':'');
  b.textContent = cat;
  b.onclick = ()=>{selectedCategory=cat;renderCategories();renderProducts()};
  $('categories').append(b);
 });
}
function renderProducts() {
 const query = $('search').value.trim().toLowerCase();
 const filtered = products.filter(p=>(selectedCategory==='Todos'||p.category===selectedCategory) && (String(p.name+' '+(p.description||'')).toLowerCase().includes(query)));
 const root = $('products');
 root.innerHTML = '';
 if(useDemo) {
  const msg = document.createElement('p');
  msg.className = 'demo-message';
  msg.textContent = 'Visualização de demonstração: conecte o banco e cadastre seus produtos para publicar o catálogo real.';
  root.append(msg);
 }
 if(!filtered.length) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = '<span>🍪</span><strong>Nenhuma delícia por aqui ainda</strong><p>Volte em breve para conferir as novidades.</p>';
  root.append(empty);
  return;
 }
 filtered.forEach((p,i)=>{
  const card = document.createElement('article');
  card.className = 'product-card';
  const image = p.image_url ? '<img src="'+escapeAttr(p.image_url)+'" alt="'+escapeAttr(p.name)+'" loading="lazy">' : '<div class="placeholder-art art-'+(i%3)+'"><span>'+(String(p.category).toLowerCase().includes('bisco')?'🍪':String(p.category).toLowerCase().includes('kit')?'🎁':'🍫')+'</span><small>DOCES DA GI</small></div>';
  const sale = p.original_price && Number(p.original_price)>Number(p.price) ? '<span class="sale-tag">OFERTA</span>' : '';
  const sold = Number(p.stock)<=0 ? '<span class="sold-tag">ESGOTADO</span>' : '';
  const oldPrice = p.original_price && Number(p.original_price)>Number(p.price) ? '<del>'+money(p.original_price)+'</del>' : '';
  card.innerHTML = '<div class="product-image">'+image+sale+sold+'</div><div class="product-details"><span class="product-category">'+escapeHtml(p.category||'Delícias')+'</span><h3>'+escapeHtml(p.name)+'</h3><p>'+escapeHtml(p.description||'Uma delícia preparada para você.')+'</p><div class="product-bottom"><div class="price-stack">'+oldPrice+'<strong>'+money(p.price)+'</strong></div><button class="add-button" '+(Number(p.stock)<=0?'disabled':'')+' aria-label="Adicionar ao carrinho">+</button></div><small class="stock-label">'+(Number(p.stock)<=0?'Estoque: 0 unidades · Esgotado':'Estoque: '+Number(p.stock)+' '+(Number(p.stock)===1?'unidade':'unidades'))+'</small></div>';
  card.querySelector('.add-button').onclick = e=>{e.stopPropagation();addToCart(p,1);toast('Adicionado à sua sacola ♡')};
  card.style.cursor = 'pointer';
  card.setAttribute('tabindex','0');
  card.setAttribute('role','button');
  card.setAttribute('aria-label','Ver detalhes de '+p.name);
  card.onclick = e => { if (!e.target.closest('.add-button')) openProductModal(p); };
  card.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); openProductModal(p); } };
  root.append(card);
 });
}

let modalProduct = null;
let modalQuantity = 1;
function ensureProductModal() {
 if ($('product-modal-backdrop')) return;
 const backdrop = document.createElement('div');
 backdrop.id = 'product-modal-backdrop';
 backdrop.className = 'product-modal-backdrop hidden';
 backdrop.innerHTML = '<section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button type="button" class="product-modal-close" aria-label="Fechar">×</button><div class="product-modal-content"><div class="product-modal-image" id="product-modal-image"></div><div class="product-modal-info"><span id="product-modal-category" class="product-category"></span><h2 id="product-modal-title"></h2><div class="product-modal-prices"><strong id="product-modal-price"></strong><del id="product-modal-old-price" class="hidden"></del></div><p id="product-modal-stock" class="product-modal-stock"></p><p id="product-modal-description" class="product-modal-description"></p><div class="product-modal-quantity"><strong>Quantidade</strong><div class="quantity-control"><button type="button" id="product-modal-minus" aria-label="Diminuir quantidade">−</button><span id="product-modal-quantity">1</span><button type="button" id="product-modal-plus" aria-label="Aumentar quantidade">+</button></div></div><div class="product-modal-total"><span>Total do pedido</span><strong id="product-modal-total"></strong></div><button type="button" id="product-modal-checkout" class="primary full product-modal-checkout">Finalizar pelo WhatsApp <span>↗</span></button></div></div></section>';
 document.body.append(backdrop);
 backdrop.querySelector('.product-modal-close').onclick = closeProductModal;
 backdrop.addEventListener('click', e => { if (e.target === backdrop) closeProductModal(); });
 $('product-modal-minus').onclick = () => updateModalQuantity(-1);
 $('product-modal-plus').onclick = () => updateModalQuantity(1);
 $('product-modal-checkout').onclick = checkoutModalProduct;
 document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProductModal(); });
}
function openProductModal(p) {
 if (Number(p.stock) <= 0) { toast('Este produto está esgotado no momento.'); return; }
 ensureProductModal();
 modalProduct = p; modalQuantity = 1;
 $('product-modal-category').textContent = p.category || 'Delícias';
 $('product-modal-title').textContent = p.name || 'Delícia da Gi';
 $('product-modal-price').textContent = money(p.price);
 const hasOldPrice = p.original_price && Number(p.original_price) > Number(p.price);
 $('product-modal-old-price').textContent = hasOldPrice ? money(p.original_price) : '';
 $('product-modal-old-price').classList.toggle('hidden', !hasOldPrice);
 $('product-modal-stock').textContent = 'Estoque: ' + Number(p.stock) + ' ' + (Number(p.stock) === 1 ? 'unidade' : 'unidades');
 $('product-modal-description').textContent = p.description || 'Uma delícia preparada para deixar seu dia mais gostoso.';
 $('product-modal-image').innerHTML = p.image_url ? '<img src="' + escapeAttr(p.image_url) + '" alt="' + escapeAttr(p.name) + '">' : '<div class="product-modal-placeholder">🍫<small>DOCES DA GI</small></div>';
 $('product-modal-plus').disabled = modalQuantity >= Number(p.stock);
 $('product-modal-minus').disabled = true;
 $('product-modal-quantity').textContent = modalQuantity;
 $('product-modal-total').textContent = money(Number(p.price) * modalQuantity);
 $('product-modal-checkout').disabled = false;
 $('product-modal-backdrop').classList.remove('hidden');
 document.body.classList.add('modal-open');
}
function updateModalQuantity(delta) {
 if (!modalProduct) return;
 modalQuantity = Math.max(1, Math.min(Number(modalProduct.stock), modalQuantity + delta));
 $('product-modal-quantity').textContent = modalQuantity;
 $('product-modal-total').textContent = money(Number(modalProduct.price) * modalQuantity);
 $('product-modal-minus').disabled = modalQuantity <= 1;
 $('product-modal-plus').disabled = modalQuantity >= Number(modalProduct.stock);
}
function closeProductModal() {
 const backdrop = $('product-modal-backdrop');
 if (backdrop) backdrop.classList.add('hidden');
 document.body.classList.remove('modal-open');
 modalProduct = null;
}
function checkoutModalProduct() {
 if (!modalProduct || modalQuantity < 1) return;
 const number = (whatsappNumber || '').replace(/\\D/g, '');
 if (!number) { toast('O WhatsApp da loja ainda precisa ser configurado.'); return; }
 const total = Number(modalProduct.price) * modalQuantity;
 const msg = 'Olá, Gi! 💕 Quero fazer um pedido:\\n\\n• ' + modalProduct.name + ' — ' + modalQuantity + 'x ' + money(modalProduct.price) + ' = ' + money(total) + '\\n\\n*Total dos produtos: ' + money(total) + '*\\n\\nComo combinamos a entrega/retirada e o pagamento?';
 window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
}

function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escapeAttr(v){return escapeHtml(v)}
function addToCart(p,delta) {
 const next = {...cart};
 const current = next[p.id]||0;
 const qty = current+delta;
 if(qty<=0) delete next[p.id];
 else next[p.id] = Math.min(qty,Math.max(1,Number(p.stock)||1));
 cart = next;
 renderCart();
}
function currentCart() {
 return Object.entries(cart).map(([id,qty])=>({product:products.find(p=>p.id===id)||sampleProducts.find(p=>p.id===id),qty})).filter(x=>x.product);
}
function renderCart() {
 const items = currentCart();
 const count = items.reduce((sum,item)=>sum+item.qty,0);
 const total = items.reduce((sum,item)=>sum+Number(item.product.price)*item.qty,0);
 $('cart-count').textContent = count;
 $('drawer-count').textContent = '('+count+')';
 $('cart-lines').innerHTML = '';
 if(!items.length) {
  $('cart-lines').innerHTML = '<div class="empty-state"><span>🛍️</span><strong>Sua sacola está esperando</strong><p>Adicione suas delícias favoritas para começar.</p></div>';
  $('cart-summary').innerHTML = '';
  return;
 }
 items.forEach(({product,qty})=>{
  const row = document.createElement('div');
  row.className = 'cart-line';
  const image = product.image_url ? '<img src="'+escapeAttr(product.image_url)+'" alt="">' : '<span>🍪</span>';
  row.innerHTML = '<div class="cart-line-image">'+image+'</div><div class="cart-line-main"><strong>'+escapeHtml(product.name)+'</strong><span>'+money(product.price)+'</span><div class="quantity-control"><button class="minus" aria-label="Diminuir quantidade">−</button><span>'+qty+'</span><button class="plus" aria-label="Aumentar quantidade" '+(qty>=Number(product.stock)?'disabled':'')+'>+</button></div></div><strong class="line-total">'+money(product.price*qty)+'</strong>';
  row.querySelector('.minus').onclick=()=>addToCart(product,-1);
  row.querySelector('.plus').onclick=()=>addToCart(product,1);
  $('cart-lines').append(row);
 });
 $('cart-summary').innerHTML = '<div><span>Subtotal dos produtos</span><strong>'+money(total)+'</strong></div><small>Entrega e pagamento serão combinados diretamente com a Gi pelo WhatsApp. O estoque é informativo até a confirmação do pedido.</small><button id="checkout" class="primary full">Finalizar pelo WhatsApp <span>↗</span></button><button id="continue-shopping" class="continue-button">Continuar escolhendo</button>';
 $('checkout').onclick=checkout;
 $('continue-shopping').onclick=()=>$('cart-backdrop').classList.add('hidden');
}
function checkout() {
 const items = currentCart();
 if(!items.length) return;
 const number = (whatsappNumber||'').replace(/\D/g,'');
 if(!number) {toast('O WhatsApp da loja ainda precisa ser configurado.');return}
 const total = items.reduce((sum,item)=>sum+Number(item.product.price)*item.qty,0);
 const lines = items.map(({product,qty})=>'• '+product.name+' — '+qty+'x '+money(product.price)+' = '+money(product.price*qty)).join('\n');
 const msg = 'Olá, Gi! 💕 Quero fazer um pedido:\n\n'+lines+'\n\n*Total dos produtos: '+money(total)+'*\n\nComo combinamos a entrega/retirada e o pagamento?';
 window.open('https://wa.me/'+number+'?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
}
let firstAccessMode = false;
function setFirstAccessMode(enabled) {
 firstAccessMode = enabled;
 $('login-submit').textContent = enabled ? 'Criar minha conta' : 'Entrar no painel';
 $('first-access-toggle').textContent = enabled ? 'Já tenho conta — voltar ao login' : 'Primeiro acesso? Criar conta';
 $('login-password').setAttribute('autocomplete', enabled ? 'new-password' : 'current-password');
 $('login-password').setAttribute('minlength', enabled ? '8' : '1');
 $('login-password').setAttribute('placeholder', enabled ? 'Crie uma senha com pelo menos 8 caracteres' : '');
 $('login-help').textContent = enabled
  ? 'Use o e-mail da administradora e crie uma senha com pelo menos 8 caracteres. Após confirmar o e-mail, a conta ainda precisa ser autorizada no painel.'
  : 'Se ainda não tem senha, use “Primeiro acesso” para cadastrar sua conta. A liberação de administradora será validada separadamente.';
 $('admin-notice').classList.add('hidden');
}
async function login(e) {
 e.preventDefault();
 $('admin-notice').classList.add('hidden');
 const email = $('login-email').value.trim();
 const password = $('login-password').value;
 if(firstAccessMode) {
  if(password.length < 8) { notice('Crie uma senha com pelo menos 8 caracteres.'); return; }
  const {data,error} = await supabase.auth.signUp({
   email,
   password,
   options: { emailRedirectTo: 'https://docesdagi-tau.vercel.app/admin' }
  });
  if(error) {
   notice(error.message.includes('already registered') || error.message.includes('already been registered')
    ? 'Esse e-mail já possui uma conta. Volte ao login ou aguarde para tentar recuperar a senha.'
    : 'Não foi possível criar a conta: ' + error.message);
   return;
  }
  setFirstAccessMode(false);
  $('login-password').value = '';
  notice(data.session
   ? 'Conta criada. Acesso de administradora ainda precisa ser autorizado antes de gerenciar produtos.'
   : 'Conta criada! Confira o e-mail para confirmar o cadastro. Depois, a conta ainda precisa ser autorizada como administradora.');
  return;
 }
 const {data,error} = await supabase.auth.signInWithPassword({email,password});
 if(error){notice('Não foi possível entrar. Confira o e-mail, a senha e se sua conta está autorizada como administradora.');return}
 session=data.session;
 showAdmin();
 notice('Login realizado.');
}
async function logout() {
 await supabase.auth.signOut();
 session=null;adminProducts=[];
 $('login-password').value='';
 showAdmin();
 notice('Você saiu do painel.');
}
async function loadAdminProducts() {
 $('admin-products').innerHTML='<p>Carregando produtos...</p>';
 const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false});
 if(error){$('admin-products').innerHTML='<div class="empty-state"><strong>Sem permissão de administradora</strong><p>Confira se seu usuário foi adicionado à tabela public.admins.</p></div>';return}
 adminProducts=data||[];
 renderAdminProducts();
}
function renderAdminProducts() {
 const root=$('admin-products');root.innerHTML='';
 if(!adminProducts.length){root.innerHTML='<div class="empty-state"><span>🍪</span><strong>Seu catálogo começa aqui</strong><p>Cadastre o primeiro doce usando o formulário.</p></div>';return}
 adminProducts.forEach(p=>{
  const row=document.createElement('article');row.className='admin-product';
  row.innerHTML='<div class="mini-image">'+(p.image_url?'<img src="'+escapeAttr(p.image_url)+'" alt="">':'<span>🍪</span>')+'</div><div class="admin-product-info"><strong>'+escapeHtml(p.name)+'</strong><span>'+money(p.price)+' · Estoque: '+p.stock+'</span><small>'+(p.active?'Visível na loja':'Oculto da loja')+'</small><div class="row-actions"><button class="edit">Editar</button><button class="toggle">'+(p.active?'Ocultar':'Exibir')+'</button><button class="danger delete">Excluir</button></div></div>';
  row.querySelector('.edit').onclick=()=>editProduct(p);
  row.querySelector('.toggle').onclick=()=>toggleActive(p);
  row.querySelector('.delete').onclick=()=>deleteProduct(p);
  root.append(row);
 });
}
function editProduct(p) {
 editingId=p.id;
 $('form-title').textContent='Editar produto';
 $('product-name').value=p.name||'';
 $('product-description').value=p.description||'';
 $('product-category').value=p.category||'Doces';
 $('product-price').value=p.price;
 $('product-original').value=p.original_price??'';
 $('product-stock').value=p.stock;
 $('product-active').checked=!!p.active;
 $('product-image').value='';
 $('cancel-edit').classList.remove('hidden');
 $('product-form').scrollIntoView({behavior:'smooth',block:'start'});
}
function resetProductForm() {
 editingId=null;
 $('form-title').textContent='Adicionar produto';
 $('product-form').reset();
 $('product-category').value='Doces';
 $('product-active').checked=true;
 $('cancel-edit').classList.add('hidden');
}
async function saveProduct(e) {
 e.preventDefault();
 $('admin-notice').classList.add('hidden');
 const price=Number($('product-price').value);
 const originalRaw=$('product-original').value;
 const original=originalRaw===''?null:Number(originalRaw);
 const stock=Number($('product-stock').value);
 if(price<0||stock<0||(original!==null&&original<price)){notice('Confira os preços e o estoque. O preço riscado precisa ser maior que o preço atual.');return}
 const old=adminProducts.find(p=>p.id===editingId);
 let imageUrl=old?.image_url||'';
 const file=$('product-image').files[0];
 if(file){
  if(file.size>5*1024*1024){notice('A foto precisa ter no máximo 5 MB.');return}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notice('Use uma foto JPG, PNG ou WebP.');return}
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
  const path=crypto.randomUUID()+'.'+ext;
  const {error:uploadError}=await supabase.storage.from('doces-produtos').upload(path,file,{upsert:false,contentType:file.type});
  if(uploadError){notice('Erro ao enviar a foto. Confira se o armazenamento foi configurado corretamente.');return}
  imageUrl=supabase.storage.from('doces-produtos').getPublicUrl(path).data.publicUrl;
 }
 const payload={name:$('product-name').value.trim(),description:$('product-description').value.trim(),category:$('product-category').value.trim()||'Doces',price,original_price:original,stock:Math.floor(stock),active:$('product-active').checked,image_url:imageUrl,updated_at:new Date().toISOString()};
 const result=editingId?await supabase.from('products').update(payload).eq('id',editingId):await supabase.from('products').insert(payload);
 if(result.error){notice('Não foi possível salvar. Verifique a conexão e a permissão de administradora.');return}
 resetProductForm();
 await loadAdminProducts();
 await loadProducts();
 notice(editingId?'Produto atualizado!':'Produto salvo com sucesso!');
}
async function toggleActive(p) {
 const {error}=await supabase.from('products').update({active:!p.active}).eq('id',p.id);
 if(error){notice('Não foi possível alterar a visibilidade do produto.');return}
 await loadAdminProducts();await loadProducts();notice('Visibilidade atualizada.');
}
async function deleteProduct(p) {
 if(!confirm('Excluir "'+p.name+'"? Essa ação não pode ser desfeita.'))return;
 const {error}=await supabase.from('products').delete().eq('id',p.id);
 if(error){notice('Não foi possível excluir este produto.');return}
 await loadAdminProducts();await loadProducts();notice('Produto excluído.');
}

ensureProductModal();
$('open-cart').onclick=()=>$('cart-backdrop').classList.remove('hidden');
$('close-cart').onclick=()=>$('cart-backdrop').classList.add('hidden');
$('cart-backdrop').addEventListener('click',e=>{if(e.target===$('cart-backdrop'))$('cart-backdrop').classList.add('hidden')});
$('back-store').onclick=goStore;
$('login-form').addEventListener('submit',login);
$('first-access-toggle').addEventListener('click',()=>setFirstAccessMode(!firstAccessMode));
$('admin-logout').onclick=logout;
$('product-form').addEventListener('submit',saveProduct);
$('cancel-edit').onclick=resetProductForm;
$('search').addEventListener('input',renderProducts);
$('save-whatsapp').onclick=()=>{
 whatsappNumber=$('whatsapp-number').value.replace(/\D/g,'');
 localStorage.setItem('docesdagi_whatsapp',whatsappNumber);
 notice('Número salvo neste navegador. Para funcionar para todos os clientes, configure VITE_WHATSAPP_NUMBER nas variáveis da Vercel.');
};
window.addEventListener('popstate',()=>{
 if(location.pathname.startsWith('/admin'))showAdmin();
 else goStoreWithoutHistory();
});
function goStoreWithoutHistory(){
 $('admin-view').classList.add('hidden');
 $('storefront').classList.remove('hidden');
 document.querySelector('.site-header').classList.remove('hidden');
 document.querySelector('.site-footer').classList.remove('hidden');
 loadProducts();
}
supabase.auth.getSession().then(({data})=>{session=data.session;if(location.pathname.startsWith('/admin'))showAdmin()});
supabase.auth.onAuthStateChange((_event,newSession)=>{session=newSession;if(location.pathname.startsWith('/admin'))showAdmin()});
if(location.pathname.startsWith('/admin'))showAdmin();
loadProducts();