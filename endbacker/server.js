
  import express from 'express';
  import https from 'https';
  import multer from 'multer';
  import cors from 'cors';
  import fs from 'fs';
  import bodyParser from 'body-parser';
  import cookieParser from 'cookie-parser';
  import stripe from 'stripe';
  import path from 'path';

  import api from './api.js';
  import * as views from './views';
  import {DEBUG, MODE, ORIGIN} from './common'
  import {COOKIENAME, BRANCH, sleep} from '../common';
  import env from './env';
  import {safe} from './interface/safe';

  const branch = BRANCH == 'master' ? 'master' : 'staging';
  const COOKIEOPTION = {httpOnly: true, secure: true};

  const publishableKey = env[MODE].PUBLISHABLE_KEY;
  const secretKey = env[MODE].SECRET_KEY;
  const Stripe = stripe(secretKey);

  export const PRODUCT_TYPE = "onetime"; // "subscription"

  const PORT = process.argv[2] || '8001';

  console.log({PORT}, process.argv);

  const STATE = {
    chooseplan: {
      planchosen: doSubscribeSignup,
    },
    demolanding: {
      ready: doOnboarding,
      tellmeaboutdatasavings: doOnboarding2,
      imreadytotryit: doOnboarding3,
      login: doLogin
    },
    landing: {
      signup: doSubscribeSignup,
      login: doLogin
    },
    create: {
      create2: doCreate2,
      create3: doCreate3,
      created: doCreated
    },
    loginonly: {
      login: doLogin
    },
    signuponly: {
      signup: doSubscribeSignup
    },
    login: {
      loginokay: doProfile,
      loginfail: doLoginAgain
    },
    pay: {
      stripecharge: doStripeCharge
    },
    chargeokay: {
      signup: doCreate1,
    },
    signup: {
      signup: doCreate1,
      signupfail: doSignupAgain,
    },
    subscribesignup: {
      subscribeokay: doCreate1,
      subscribefail: doSubscribeAgain,
    },
    createuserhome: {
      nextstep: doProvisionApp,
      fail: doReportFailAndBeginSupport
    },
    provisionapp: {
      nextstep: doInitiateApp,
      fail: doReportFailAndBeginSupport
    },
    initiateapp: {
      nextstep: doFirstSignIn,
      fail: doReportFailAndBeginSupport
    },
    profile: {
      logout: doLogout,
      startapp: doStartApp
    },
    startapp: {
      nextstep: doLoadApp,
      fail: doReportFailAndBeginSupport
    }
  };

  const PLAN = {
    neon1week: {
      id: {
        live: "sku_F0dBzZVHI3M9x9",
        test: "sku_F0d5eHXDo9uM2t",
      },
      name: "neon1week",
      description: "Dosy Browser Neon 1 Week",
      amount: "15.20",
      rawAmount: "1520",
    },
    neon1month: {
      id: {
        live: "sku_F0dBP4FMTzOv1m",
        test: "sku_F0d5HLGNmkm5JD",
      },
      name: "neon1month",
      description: "Dosy Browser Neon 1 Month",
      amount: "51.00",
      rawAmount: "5100",
    },
    neon3months: {
      id: {
        live: "sku_F0dCbvbCrJXUUg",
        test: "sku_F0d5wqR90wxuuy"
      },
      name: "neon3months",
      description: "Dosy Browser Neon 3 Months",
      amount: "117.00",
      rawAmount: "11700",
    }
  };

  process.on('unhandledRejection', e => {
    console.info('promise rejection', e);
  });

  process.on('uncaughtException', e => {
    console.info('exception', e);
    process.exit(1);
  });

  const secure_options = {
    cert: fs.readFileSync(`../../dosy-browser/sslcert/${branch}/fullchain.pem`),
    key: fs.readFileSync(`../../dosy-browser/sslcert/${branch}/privkey.pem`),
    ca: fs.readFileSync(`../../dosy-browser/sslcert/${branch}/chain.pem`),
  };

  const multipart = multer();
  const app = express();
  const server = https.createServer(secure_options, app);
  app.use(cors({
    origin: ORIGIN,
    credentials: true,
    optionsSuccessState: 200
  }));
  app.options('*', cors({
    origin: ORIGIN,
    credentials: true,
    optionsSuccessState: 200
  }));
  app.use('/', express.static(path.join(__dirname, 'views')));
  app.use(bodyParser.urlencoded({extended:true}));
  app.use(bodyParser.json({extended:true}));
  app.use(cookieParser());
  server.listen(PORT);

  // session middleware
    app.get('*', wrap(async (req, res, next) => {
      let session;
      try {
        session = await api.getSession(req.cookies[COOKIENAME]);
      } catch(e){console.warn(e)}
      if ( !! session ) {
        req.session = session;
      }
      next();
    }));

    app.post('*', wrap(async (req, res, next) => {
      let session;
      try {
        session = await api.getSession(req.cookies[COOKIENAME]);
      } catch(e){console.warn(e)}
      if ( !! session ) {
        req.session = session;
      }
      next();
    }));

  // basic routes
    app.get('/', wrap(async (req, res) => {
      res.type('html');
      if ( req.session ) {
        const {status} = await api.getUserdata(req.session.cookie);
        rend(res,views.profile({status,session:req.session}));
      } else {
        rend(res,views.landing({}));
      }
    }));

    app.get('/demo-landing', wrap(async (req, res) => {
      res.type('html');
      if ( req.session ) {
        const {status} = await api.getUserdata(req.session.cookie);
        rend(res,views.profile({status,session:req.session}));
      } else {
        rend(res,views.landing({}));
      }
    }));

    app.get('/profile', wrap(async (req, res) => {
      res.type('html');
      if ( req.session ) {
        const {status} = await api.getUserdata(req.session.cookie);
        rend(res,views.profile({status,session:req.session}));
      } else {
        rend(res,views.landing({}));
      }
    }));

  // transition handler
    app.post('/current/:current/event/:event', multipart.any(), wrap(async (req, res) => {
      const {current,event} = req.params;
      let transition;
      try {
        transition = STATE[current][event];
        DEBUG.val && console.log(current,event,transition);
        await transition(req, res);
      } catch(e) {
        console.warn(e);
        if ( ! transition ) {
          throw new TypeError(`Not a transition: ${current} -> ${event}`);
        } else {
          throw e;
        }
      }
    }));

  // transitions
    async function doOnboarding(req, res) {
      rend(res,views.landing({}));
    }

    async function doOnboarding2(req, res) {
      rend(res,views.signup({}));
    }

    async function doOnboarding3(req, res) {
      rend(res,views.choosePlan({}));
    }

    async function doSubscribeSignup(req, res) {
      let {plan} = req.body;
      console.log(plan, req.body);
      plan = PLAN[plan];
      res.type('html');
      rend(res,views.pay({plan, publishableKey}));
    }

    async function doSignupAgain(req, res) {
      const {subid} = req.body;
      res.type('html');
      rend(res,views.subscribesignup({
        current: 'signup', subid
      }));
    }

    async function doStripeCharge(req, res) {
      const {
        plan,
        stripeToken: source, 
        stripeEmail: email, 
        stripeTokenType: type
      } = req.body;
      const subid = genId('subid');
      const Plan = PLAN[plan];

      let customer, charge;

      if ( PRODUCT_TYPE == "subscription" ) {
        try {
          customer = await Stripe.customers.create({email, source});
        } catch(e) {
          console.warn(e);
          throw new TypeError(`Error creating stripe customer`);
        }
      }

      if (Plan.name == 'freedemo') {
        charge = {status:"OK"};
        throw new Error(
          `Sorry freedemo is no longer available on this server.`
        );
      } else {
        if ( PRODUCT_TYPE == "subscription" ) {
          try {
            charge = await Stripe.subscriptions.create({
              items: [{plan:Plan.id[MODE]}],
              customer: customer.id
            });
          } catch(e) {
            console.warn(e);
            throw new TypeError(`Error creating stripe subscription charge`);
          }
        } else {
          try {
            const order = await Stripe.orders.create({
              items: [{parent:Plan.id[MODE], type:'sku', quantity:1}],
              email,
              currency: 'usd',
            });
            charge = await Stripe.orders.pay(order.id, {
              source
            });
          } catch(e) {
            console.warn(e);
            throw new TypeError(`Error creating stripe order charge ${Plan}`);
          }
        }
      }

      await api.save_subscribe({email, plan: Plan.name, subid})

      if ( charge.status == "incomplete" ) {
        res.type('html');
        rend(res,views.pay({
          message: 'There was an issue with your payment method. Please try another.', 
          plan:Plan, publishableKey
        }));
      } else {
        res.type('html');
        rend(res,views.subscribesignup({
          current: 'chargeokay', plan: Plan, subid
        }));
      }
    }

    async function doLogin(req, res) {
      res.type('html');
      if ( req.session ) {
        const {status} = await api.getUserdata(req.session.cookie);
        res.redirect("/profile");
      } else {
        const {username, password} = req.body;
        let status, session;
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        try {
          ({status, session} = await api.authin({username,password,ip}));
        } catch(e) {
          console.warn(e);
        }
        switch(status.message) {
          case "OK": {
            res.cookie(COOKIENAME, session.cookie, COOKIEOPTION);
            rend(res,views.loginokay({}));
            break;
          }
          case "NO": {
            ({status} = await api.userExists({username}));
            res.status(401);
            if ( status.message == "OK" ) {
              status.userMessage = `User ${username} exists. 
                Bad password.
                <br>
                Need to reset your password? 
                <a target=_blank class=zig-click-ds href=https://forms.gle/3uVoDKMRSE1e6Gpp6>do so here.</a>
                `;
              rend(res,views.loginfail({status}));
            } else {
              status.userMessage = `User ${username} does not exist.`;
              rend(res,views.loginfail({status}));
            }
            break;  
          }
        }
      }
    }

    async function doProfile(req, res) {
      res.redirect(`${ORIGIN}:${PORT}/profile/`)
    }

    async function doLoginAgain(req, res) {
      res.type('html');
      rend(res,views.login({}));
    }

    async function doSubscribeAgain(req, res) {
      
    }

    async function doCreate1(req, res) {
      const {username, password, subid} = req.body;
      res.type('html');

      let status;
      try {
        ({status} = await api.check_subscribe({subid}));
      } catch(e) {
        console.warn(e);
        throw new TypeError(`Error checking subscription status.`);
      }

      if ( status.message == "OK" ) {
        ({status} = await api.userExists({username}));
        if ( status.message == "OK" ) {
          status.userMessage = `User ${username} exists. Choose another name.`;
          rend(res,views.signupfail({status, subid}));
        } else {
          try {
            ({status} = await api.createUser1({username,password, groups: ['litewait']}));
          } catch(e) {
            console.warn(e)
          }

          if ( status.message == "OK") {
            try {
              ({status} = await api.update_subscribe({subid, username}));
            } catch(e) {
              console.warn(e);
            }
          }

          if ( status.message == "OK" ) {
            rend(res,views.create1({username,subid}));
          } else {
            status.userMessage = `Create user step 1 failed. Please try again.`;
            rend(res,views.signupfail({status, subid}));
          }
        }
      } else {
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        console.warn({error: `Incorrect subid or username`, subid, username, ip});
        throw new TypeError(`Incorrect subscription id or username`);
      }
    }

    async function doCreate2(req, res) {
      const {username, subid} = req.body;
      res.type('html');

      let status;
      try {
        ({status} = await api.check_subscribe({subid,username}));
      } catch(e) {
        console.warn(e);
        throw new TypeError(`Error checking subscription status.`);
      }

      if ( status.message == "OK" ) {
        try {
          ({status} = await api.createUser2({username,subid}));
        } catch(e) {
          console.warn(e)
        }
        if ( status.message == "OK") {
          rend(res,views.create2({username,subid}));
        } else {
          status.userMessage = `Create user step 2 failed. Please try again.`;
          rend(res,views.signupfail({status, subid}));
        }
      } else {
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        console.warn({error: `Incorrect subid or username`, subid, username, ip});
        throw new TypeError(`Incorrect subscription id or username`);
      }
    }

    async function doCreate3(req, res) {
      const {username, subid} = req.body;
      res.type('html');

      let status;
      try {
        ({status} = await api.check_subscribe({subid,username}));
      } catch(e) {
        console.warn(e);
        throw new TypeError(`Error checking subscription status.`);
      }

      if ( status.message == "OK" ) {
        try {
          ({status} = await api.createUser3({username}));
        } catch(e) {
          console.warn(e)
        }
        if ( status.message == "OK") {
          rend(res,views.create3({username,subid}));
        } else {
          status.userMessage = `Create user step 3 failed. Please try again.`;
          rend(res,views.signupfail({status, subid}));
        }
      } else {
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        console.warn({error: `Incorrect subid or username`, subid, username, ip});
        throw new TypeError(`Incorrect subscription id or username`);
      }
    }

    async function doCreated(req, res) {
      const {username} = req.body;
      safe(username);
      res.type('html');

      let status = {};

      status.username = username;
      status.userMessage = `${username}, your setup is complete! You may now login.`;
      rend(res,views.login({status}));
    }

    async function doCreateUserAgain(req, res) {

    }

    async function doProvisionApp(req, res) {

    }

    async function doInitiateApp(req, res) {

    }

    async function doFirstSignIn(req, res) {

    }

    async function doLogout(req, res) {
      const {status} = await api.logout(req.session.cookie); 
      res.redirect("/");
    }

    async function doStartApp(req, res) {
      const {cookie, username} = req.session;
      const token = genId('token');
      const {status} = await api.initiate({cookie, username, token});
      const port = status.port;
      const browserUrl = `https://${req.hostname}:${port}/login?token=${token}`;
      const resp = {
        browserUrl
      };
      res.end(JSON.stringify(resp));
    }

    async function doLoadApp(req, res) {

    }

    async function doReportFailAndBeginSupport(req, res) {

    }

  // error handling middleware
    app.use('*', (err, req, res, next) => {
      try {
        res.type('json');
      } catch(e){}
      let message = '';
      if ( DEBUG.dev && DEBUG.val ) {
        message = s({error: { msg: err.message, stack: err.stack.split(/\n/g) }});
      } else {
        message = s({error: err.message});
      }
      res.write(message);
      res.end();
      console.warn(err);
    });

    function s(o) {
      let r;
      if ( typeof o == "string" ) r = 0;
      else try {
        r = JSON.stringify(o, null, 2);
      } catch(e) {
        DEBUG.val > DEBUG.hi && console.warn(e);
      }
      try {
        r = r + '';
      } catch(e) {
        DEBUG.val > DEBUG.hi && console.warn(e);
      }
      return r;
    }

  // helpers
    function wrap(fn) {
      return async function handler(req, res, next) {
        try {
          await fn(req, res, next);
        } catch(e) {
          DEBUG.val && console.log(e);
          console.info(`caught error in ${fn}`);
          next(e);
        }
      }
    }

    function genId(prefix = 'pre') {
      return prefix + ((+ new Date)*Math.random()).toString(36);
    }

    function rend(response, ...content) {
      response.end(views.page(...content));
    }
