import { login, logout, update, update_password } from './login';
import { pay_it } from './stripe';
var email, password;

const frm = document.querySelector('#frm');
if (frm)
  frm.addEventListener('submit', (e) => {
    e.preventDefault();
    email = document.querySelector('#email').value;
    password = document.querySelector('#password').value;
    //console.log(email, password);
    login(email, password);
  });
const logou = document.querySelector('.nav__el--logout');
//console.log(logou);
if (logou) {
  logou.addEventListener('click', (e) => {
    logout();
  });
}
const lg = document.querySelector('#lg');
if (lg) {
  lg.addEventListener('click', (e) => {
    location.replace('/login');
  });
}
const us = document.querySelector('#us');
//console.log(us);
if (us) {
  // console.log(us);
  us.addEventListener('click', (e) => {
    location.replace('/me');
  });
}
const update_frm = document.querySelector('#usr_data');
//console.log(update_frm);
if (update_frm) {
  update_frm.addEventListener('submit', (e) => {
    e.preventDefault();
    const frmc = new FormData();
    const nam = document.getElementById('name').value;
    const photo = document.getElementById('photo').files[0];
    email = document.getElementById('email').value;
    frmc.append('name', nam);
    frmc.append('photo', photo);
    frmc.append('email', email);
    // console.log(nam);

    update(frmc);
  });
}
const pswd_frm = document.querySelector('#user_password');
//console.log(update_frm);
if (pswd_frm) {
  pswd_frm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // console.log('bakasur');
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const confirmnewPassword =
      document.getElementById('password-confirm').value;

    // console.log(nam);

    await update_password({ currentPassword, newPassword, confirmnewPassword });
    document.getElementById('password-current').textContent = '';
    document.getElementById('password').textContent = '';
    document.getElementById('password-confirm').textContent = '';
    location.assign('/me');
  });
}

const pay = document.getElementById('pay_now');
if (pay) {
  pay.addEventListener('click', (e) => {
    pay_it(e.target.dataset.tourId);
  });
}
