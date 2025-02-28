document.addEventListener('DOMContentLoaded', () => {
  const perpetualBtn = document.querySelector('.pricing-option:nth-child(1) .select-button');
  const resellerBtn = document.querySelector('.pricing-option:nth-child(2) .select-button');
  const customizationCheckbox = document.querySelector('#customization-checkbox');
  const purchaseBtn = document.querySelector('.purchase-button');
  const STRIPE_LINK = 'https://buy.stripe.com/00g29k9pTfHdb2815g';
  const emailContainer = document.getElementById('email-container'); // Add an ID to the email container in your HTML
  const customizationOption = document.querySelector('.customization-option');

  let selectedOption = null;

  purchaseBtn.addEventListener('click', handlePurchase);

  perpetualBtn.addEventListener('click', () => {
    selectedOption = 'Perpetual';
    perpetualBtn.closest('.pricing-option').classList.add('selected');
    resellerBtn.closest('.pricing-option').classList.remove('selected');
    emailContainer.innerHTML = "";
  });

  resellerBtn.addEventListener('click', () => {
    selectedOption = 'Partner/Reseller';
    perpetualBtn.closest('.pricing-option').classList.remove('selected');
    resellerBtn.closest('.pricing-option').classList.add('selected');
    emailContainer.innerHTML = "";
  });

  purchaseBtn.addEventListener('click', () => {
    if (!selectedOption) {
      alert('Please select a pricing option.');
      return;
    }

    const customizationSelected = customizationCheckbox.checked;
    let message = `Selected option: ${selectedOption}`;

    if (customizationSelected) {
      message += ' with Customization Add-on';
    }

    console.log(message);

    //alert(message);
  });

  customizationCheckbox.addEventListener('change', () => {
    customizationOption.classList.toggle('custom-selected');
    if (customizationCheckbox.checked) {
      customizationOption.style.backgroundColor = '#ffd700'; // Set bright yellow color when checked
    } else {
      customizationOption.style.backgroundColor = '#f0c674'; // Set original color when unchecked
    }
    emailContainer.innerHTML = "";
  });

  function handlePurchase() {
    const isPerpetualSelected = document.querySelector('.pricing-option.perpetual.selected') !== null;
    const isCustomSelected = customizationCheckbox.checked;

    if (isPerpetualSelected && !isCustomSelected) {
      window.location.href = STRIPE_LINK;
    } else {
      const subject = isPerpetualSelected ? 'Perpetual' : 'Partner/Reseller';
      const customization = isCustomSelected ? ' with Customization' : '';
      const emailSubject = encodeURIComponent(`${subject}${customization} License Inquiry`);
      const mailtoLink = `mailto:sales@dosyago.com?subject=${emailSubject}`;

      emailContainer.innerHTML = `<br><a href="${mailtoLink}" class="mailto-link">Email us to proceed with the purchase</a>`;
    }

  }
});

