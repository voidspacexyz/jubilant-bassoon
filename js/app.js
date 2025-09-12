// Main application logic for Money Planner

document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const salaryInput = document.getElementById('salary');
    const resultsBox = document.getElementById('results');

    // Allocated displays
    const needsAmount = document.getElementById('needsAmount');
    const wantsAmount = document.getElementById('wantsAmount');
    const savingsAmount = document.getElementById('savingsAmount');

    const allocated50 = document.getElementById('allocated50');
    const allocated30 = document.getElementById('allocated30');
    const allocated20 = document.getElementById('allocated20');
    const actual50 = document.getElementById('actual50');
    const actual30 = document.getElementById('actual30');
    const actual20 = document.getElementById('actual20');

    // Needs/Loan related
    const loanAmountInput = document.getElementById('loanAmount');
    const tenureInput = document.getElementById('tenure');
    const interestInput = document.getElementById('interestRate');
    const downpaymentInput = document.getElementById('downpayment');
    const loanResults = document.getElementById('loanResults');
    const emiAmount = document.getElementById('emiAmount');
    const totalPayment = document.getElementById('totalPayment');
    const principalAmount = document.getElementById('principalAmount');
    const interestAmount = document.getElementById('interestAmount');

    const emiDeduction = document.getElementById('emiDeduction');
    const everydayAmount = document.getElementById('everydayAmount');
    const emiDeduct = document.getElementById('emiDeduct');
    const plannedUsage = document.getElementById('plannedUsage');
    const adjNeeds = document.getElementById('adjNeeds');

    // SIP related
    const sipAmountInput = document.getElementById('sipAmount');
    const sipTenureInput = document.getElementById('sipTenure');
    const sipReturnInput = document.getElementById('sipReturn');
    const sipResults = document.getElementById('sipResults');
    const futureValue = document.getElementById('futureValue');
    const totalInvested = document.getElementById('totalInvested');
    const sipReturns = document.getElementById('sipReturns');

    // Modal
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');

    // Accordion
    const accordions = document.querySelectorAll('.accordion-header');

    function updateResults() {
        const salary = parseCurrency(salaryInput.value);
        if (salary <= 0) {
            resultsBox.classList.add('hidden');
            allocated50.textContent = allocated30.textContent = allocated20.textContent = formatCurrency(0,0);
            needsAmount.textContent = wantsAmount.textContent = savingsAmount.textContent = formatCurrency(0,0);
            // keep actuals at 0 until explicit loan/SIP inputs provided
            actual50.textContent = actual30.textContent = actual20.textContent = formatCurrency(0,0);
            return;
        }
        resultsBox.classList.remove('hidden');
        const needs = salary * 0.5;
        const wants = salary * 0.3;
        const savings = salary * 0.2;
        needsAmount.textContent = formatCurrency(needs, 0);
        wantsAmount.textContent = formatCurrency(wants, 0);
        savingsAmount.textContent = formatCurrency(savings, 0);
        allocated50.textContent = formatCurrency(needs,0);
        allocated30.textContent = formatCurrency(wants,0);
        allocated20.textContent = formatCurrency(savings,0);

        // reset actuals by default; loan/SIP update functions will set them if applicable
        actual50.textContent = actual30.textContent = actual20.textContent = formatCurrency(0,0);

        // trigger loan/SIP updates which may set actuals if inputs valid
        updateLoan();
        updateSIP();
    }

    function calculateEMI(principal, tenureMonths, annualRate) {
        principal = safeFloat(principal);
        tenureMonths = Math.max(0, Math.floor(tenureMonths));
        annualRate = safeFloat(annualRate);
        if (tenureMonths <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };
        const monthlyRate = annualRate / 12 / 100;
        if (monthlyRate === 0) {
            const emi = principal / tenureMonths;
            return { emi, totalPayment: emi * tenureMonths, totalInterest: 0 };
        }
        const x = Math.pow(1 + monthlyRate, tenureMonths);
        const emi = (principal * monthlyRate * x) / (x - 1);
        const totalPayment = emi * tenureMonths;
        const totalInterest = totalPayment - principal;
        return { emi, totalPayment, totalInterest };
    }

    function updateLoan() {
        const loanAmt = parseCurrency(loanAmountInput.value);
        const down = parseCurrency(downpaymentInput.value);
        const principal = Math.max(0, loanAmt - down);
        const tenure = parseInt(tenureInput.value) || 0;
        const rate = parseFloat(interestInput.value) || 0;
        if (loanAmt <= 0 || tenure <= 0) {
            loanResults.classList.add('hidden');
            emiAmount.textContent = totalPayment.textContent = principalAmount.textContent = interestAmount.textContent = formatCurrency(0,0);
            // ensure actual50 cleared when no loan present
            actual50.textContent = formatCurrency(0,0);
            return;
        }
        const calc = calculateEMI(principal, tenure, rate);
        loanResults.classList.remove('hidden');
        emiAmount.textContent = formatCurrency(calc.emi,0);
        totalPayment.textContent = formatCurrency(calc.totalPayment,0);
        principalAmount.textContent = formatCurrency(principal,0);
        interestAmount.textContent = formatCurrency(calc.totalInterest,0);

        // compute planned usage relative to current salary allocations
        const salary = parseCurrency(salaryInput.value);
        const origNeeds = salary * 0.5;
        const everyday = origNeeds * 0.5;
        const planned = everyday + calc.emi;

        // Update related displays
        everydayAmount.textContent = formatCurrency(everyday,0);
        emiDeduct.textContent = formatCurrency(calc.emi,0);
        plannedUsage.textContent = formatCurrency(planned,0);
        const reserveAfter = origNeeds - planned;
        adjNeeds.textContent = formatCurrency(reserveAfter,0);
        if (reserveAfter < 0) {
            adjNeeds.classList.add('text-red-600','font-semibold');
        } else {
            adjNeeds.classList.remove('text-red-600','font-semibold');
        }

        // set actual50 only when emi > 0 (i.e., loan exists)
        if (calc.emi > 0) {
            actual50.textContent = formatCurrency(planned,0);
        } else {
            actual50.textContent = formatCurrency(0,0);
        }
    }

    function updateSIP() {
        const monthly = parseCurrency(sipAmountInput.value);
        const years = parseInt(sipTenureInput.value) || 0;
        const annualRate = parseFloat(sipReturnInput.value) || 0;
        if (monthly <= 0 || years <= 0) {
            sipResults.classList.add('hidden');
            futureValue.textContent = totalInvested.textContent = sipReturns.textContent = formatCurrency(0,0);
            // ensure actual20 cleared when no SIP
            actual20.textContent = formatCurrency(0,0);
            return;
        }
        const months = years * 12;
        const r = annualRate / 12 / 100;
        let fv = 0;
        if (r === 0) {
            fv = monthly * months;
        } else {
            fv = monthly * ( (Math.pow(1 + r, months) - 1) / r ) * (1 + r);
        }
        const invested = monthly * months;
        const returns = fv - invested;
        sipResults.classList.remove('hidden');
        futureValue.textContent = formatCurrency(fv,0);
        totalInvested.textContent = formatCurrency(invested,0);
        sipReturns.textContent = formatCurrency(returns,0);

        // set actual20 to invested when SIP inputs are valid
        actual20.textContent = formatCurrency(invested,0);
    }

    // Modal functions
    window.showModal = function(type) {
        let title = '';
        let content = '';
        if (type === 'needs') {
            title = '50% Needs Breakdown';
            content = `Needs allocation: ${needsAmount.textContent}`;
        } else if (type === 'wants') {
            title = '30% Wants Breakdown';
            content = `Wants allocation: ${wantsAmount.textContent}`;
        } else if (type === 'savings') {
            title = '20% Savings/Debt Breakdown';
            content = `Savings allocation: ${savingsAmount.textContent}`;
        }
        modalTitle.textContent = title;
        modalContent.textContent = content;
        modal.classList.remove('translate-x-full');
        modal.classList.add('translate-x-0');
    };

    closeModal.addEventListener('click', () => {
        modal.classList.remove('translate-x-0');
        modal.classList.add('translate-x-full');
    });

    // Accordion toggles
    accordions.forEach(btn => {
        btn.addEventListener('click', () => {
            const body = btn.nextElementSibling;
            const chev = btn.querySelector('.chev');
            if (!body) return;
            const isOpen = !body.classList.contains('hidden');

            // Toggle only the clicked accordion so multiple can be open
            if (isOpen) {
                body.classList.add('hidden');
                if (chev) chev.classList.remove('rotate-180');
            } else {
                body.classList.remove('hidden');
                if (chev) chev.classList.add('rotate-180');
            }
        });
    });

    // Initial render
    updateResults();
});