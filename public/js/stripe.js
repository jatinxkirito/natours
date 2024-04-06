import { setAlert } from './alerts';
var stripe = Stripe(
  'pk_test_51P1XmVSJeK18sKEX4HcuEAnVNVTLENUAynXz5B6TeQsMWu1U5jLUn89D6v9SIyKLRexfjbkzQ6Y5LvcfKzGVnmnz003gsBX7nD',
);
import axios from 'axios';
export const pay_it = async (tourid) => {
  try {
    const ot = await axios({
      method: 'GET',
      url: `/api/v1/booking/checkout/${tourid}`,
    });
    console.log(ot);
    location.assign(`${ot.data.session.url}`);
  } catch (err) {
    setAlert(err);
  }
};
