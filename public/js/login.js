import axios from 'axios';
import { setAlert } from './alerts';
export const login = async (email, password) => {
  try {
    // console.log(email, password);
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    const x = res.data.status;
    //console.log(x);
    if (x == 'success') {
      //console.log(x);
      location.assign('/');
    }
  } catch (e) {
    setAlert(e.response.data.message);
    //console.log(e);
  }
};
export const update = async (data) => {
  try {
    // console.log(name, email, photo);
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update_content',
      data,
    });
    //console.log('sdk');
    const x = res.data.status;

    //console.log(x);
    if (x == 'success') {
      //console.log(x);
      location.assign('/me');
    }
  } catch (e) {
    setAlert(e.response.data.message);
    //console.log(e);
  }
};
export const update_password = async (obj) => {
  try {
    // console.log(email, password);
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/changepassword',
      data: obj,
    });
    //console.log('sdk');
    const x = res.data.status;

    //console.log(x);
    if (x == 'success') {
      //console.log(x);
      location.assign('/me');
    }
  } catch (e) {
    setAlert(e.response.data.message);
    //console.log(e);
  }
};
export const logout = async () => {
  try {
    // console.log(email, password);
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    const x = res.data.status;
    //console.log(x);
    if (x == 'success') {
      //console.log(x);
      location.assign('/');
    }
  } catch (e) {
    setAlert('Some error occured. Please try again');
    //console.log(e);
  }
};
