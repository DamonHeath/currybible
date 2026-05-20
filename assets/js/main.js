const burger = document.querySelector('[data-burger]');
const nav = document.querySelector('[data-nav]');
if (burger && nav) {
  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('[data-demo-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('[data-form-message]');
    if (message) {
      message.textContent = 'Prototype only: this form shows the intended journey. Hook it into Jotform, WPForms, Fluent Forms, or a custom WordPress handler later.';
    }
  });
});
