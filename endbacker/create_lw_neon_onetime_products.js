
  import stripe from 'stripe';
  import env from './env';

  createGood({name:'Browser Trip Pass', description: 'Access Browser for 1 week, 1 month or 3 months.', MODE: 'test'});
  createGood({name:'Browser Trip Pass', description: 'Access Browser for 1 week, 1 month or 3 months.', MODE: 'live'});

  async function createGood({name, description, MODE}) {
    const publishableKey = env[MODE].PUBLISHABLE_KEY;
    const secretKey = env[MODE].SECRET_KEY;
    const Stripe = stripe(secretKey);
    const type = 'good';
    const result = await Stripe.products.create({
      name, type, description,
      shippable: false,
      url: 'https://browsergap.xyz',
      attributes: [
        "name"
      ]
    });
    console.log(result);
  }
