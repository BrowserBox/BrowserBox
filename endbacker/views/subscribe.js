import {PRODUCT_TYPE} from '../server.js';

export function subscribe({current: current = 'subscribe'}) {
  return `
  `;
}

export function pay({message: message = '', plan, current: current = 'pay', publishableKey}) {
  return `
    <body>
      <style>
        button[type="submit"] {
          margin: 0;
          font-size: inherit;
          height: 2em;
        }
        button[type="submit"] span {
          margin: 0;
          font-size: inherit;
          height: 2em;
          line-height: 1.75;
        }
      </style>
      <form class=delay-off method=POST action=/current/${current}/event/stripecharge>
        <fieldset>
          <legend>${PRODUCT_TYPE == "onetime" ? "One-off Purchase" : "Subscription Purchase"}</legend>
          <input type=hidden name=plan value=${plan.name}>
          <p>
            ${message}
          <p>
            <label>Plan: ${plan.description}</label>
            <br>
            <label>Amount: $${plan.amount}</label>
          <p>
            ${
              plan.name == 'freedemo' ?
                `<button autofocus>Let me play for free!</button>`
                :
                `<script 
                  src=//checkout.stripe.com/v2/checkout.js
                  class=stripe-button
                  data-name="${plan.description}"
                  data-key=${publishableKey} 
                  data-locale=auto
                  data-description="${plan.description}"
                  data-label="Pay $${plan.amount}"
                  data-amount=${plan.rawAmount}
                ></script>`
            }
          </article>
        </fieldset>
      </form>
    </body>
  `;
}

export function choosePlan({current: current = 'chooseplan'}) {
  return `
    ${subscribe({current})}
    <form method=POST action=/current/${current}/event/planchosen>
      <fieldset>
        <legend>Choose your access-period</legend>
        <p>
          You can purchase access to Dosy Browser for a week, a month or a quarter.
        <p>
          <select autofocus required name=plan>
            <option selected value disabled>I'm having&hellip;&nbsp;
            <option value=neon1week>1 supser-stretched week for $15.20
            <option value=neon1month>1 mega-stretched month for $51.00 (save 22%)
            <option value=neon3months>1 insanely-stretched 3 months for $117.00 (save 40%)
          </select>
        <p>
          <label>
            <input style=display:inline; type=checkbox name=agree required>
            Sure, I agree to the Dosy Browser terms of use.
          </label>
          <br>
          <small>
            Terms of use are 
            <a class=zig-click-ds target=_blank href=https://dosyago.com/main.html#litewait-rules>
              rules</a>, 
            <a class=zig-click-ds target=_blank href=https://dosyago.com/main.html#litewait-privacy-policy>
              privacy policy</a>, 
            <a class=zig-click-ds target=_blank href=https://dosyago.com/main.html#litewait-data-retention-policy>
              data retention policy</a>, 
            <a class=zig-click-ds target=_blank href=https://dosyago.com/main.html#litewait-payment-and-refund-policy>
              payment and refund policy</a>. 
          </small>
        <p>
          <button>Make it so!</button>
      </fieldset>
    </form>
  `;
}
