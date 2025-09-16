// filepath: /home/voidspacexyz/Work/personal/costplanner/js/savings.js
// Savings-specific logic for Money Planner (20% allocation, SIP)

(function() {
    // Use common state and elements
    const { state, elements } = window.AppCommon;
    const { actual20, allocated20 } = elements;

    // Savings-specific DOM elements
    const sipAmountInput = document.getElementById('sipAmount');
    const sipTenureInput = document.getElementById('sipTenure');
    const sipReturnInput = document.getElementById('sipReturn');
    const sipResults = document.getElementById('sipResults');
    const futureValue = document.getElementById('futureValue');
    const totalInvested = document.getElementById('totalInvested');
    const sipReturns = document.getElementById('sipReturns');

    // Expose savings functions
    window.AppSavings = {
        updateSIP,
        initSavings
    };

    function updateSIP() {
        const monthly = parseCurrency(sipAmountInput.value);
        const years = parseInt(sipTenureInput.value) || 0;
        const annualRate = parseFloat(sipReturnInput.value) || 0;
        if (monthly <= 0 || years <= 0) {
            sipResults.classList.add('hidden');
            futureValue.textContent = totalInvested.textContent = sipReturns.textContent = formatCurrency(0, 0);
            state.actual[20] = 0;
            actual20.textContent = formatCurrency(0, 0);
            actual20Header.textContent = formatCurrency(0, 0);
            return;
        }
        const months = years * 12;
        const r = annualRate / 12 / 100;
        let fv = 0;
        if (r === 0) {
            fv = monthly * months;
        } else {
            fv = monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
        }
        const invested = monthly * months;
        const returns = fv - invested;
        sipResults.classList.remove('hidden');
        futureValue.textContent = formatCurrency(fv, 0);
        totalInvested.textContent = formatCurrency(invested, 0);
        sipReturns.textContent = formatCurrency(returns, 0);

        state.actual[20] = invested;
        actual20.textContent = formatCurrency(invested, 0);
        actual20Header.textContent = formatCurrency(invested, 0);
    }

    function initSavings() {
        // Wire SIP events
        [sipAmountInput, sipTenureInput, sipReturnInput].forEach(el => {
            el.addEventListener('input', updateSIP);
        });
    }
})();