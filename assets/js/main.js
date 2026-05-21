
const navToggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.main-nav');if(navToggle){navToggle.addEventListener('click',()=>{nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',nav.classList.contains('open'))})}
document.querySelectorAll('.game-toggle').forEach(btn=>{btn.addEventListener('click',()=>{const box=btn.closest('.game-banner');box.classList.toggle('open');btn.setAttribute('aria-expanded',box.classList.contains('open'))})});
const year=document.querySelector('[data-year]');if(year) year.textContent=new Date().getFullYear();
