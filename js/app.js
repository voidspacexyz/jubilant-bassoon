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

        // do not reset actuals, let updateLoan and updateSIP set them if applicable
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
        emiDeduction.textContent = formatCurrency(calc.emi,0);
        plannedUsage.textContent = formatCurrency(planned,0);
        const reserveAfter = origNeeds - planned;
        adjNeeds.textContent = formatCurrency(reserveAfter,0);
        if (reserveAfter < 0) {
            adjNeeds.classList.add('text-red-600','font-semibold');
        } else {
            adjNeeds.classList.remove('text-red-600','font-semibold');
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

// Needs items feature
(function(){
    // Utilities
    const qs = (s, el=document) => el.querySelector(s);
    const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
    const fmt = (v) => new Intl.NumberFormat().format(Number(v) || 0);
    const debounce = (fn, wait=300) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
    };

    // Elements
    const salaryInput = qs('#salary');
    const needsItemsContainer = qs('#needsItems');
    const addNeedBtn = qs('#addNeedItem');
    const resetNeedsBtn = qs('#resetNeeds');

    const loanAmount = qs('#loanAmount');
    const tenure = qs('#tenure');
    const interestRate = qs('#interestRate');
    const downpayment = qs('#downpayment');
    const includeEmiInNeeds = qs('#includeEmiInNeeds');

    const emiAmountDisplay = qs('#emiAmount');
    const loanResults = qs('#loanResults');

    const NEEDS_KEY = 'costplanner.needs.v1';

    // Default items as per blueprint (amounts will be computed from salary)
    const defaultItems = [
        { id: 'living', label: 'Living Expenses', required: true, percentOfNeeds: 50 },
        { id: 'groceries', label: 'Groceries & Food', percentOfNeeds: 20 },
        { id: 'utilities', label: 'Utilities', percentOfNeeds: 10 },
        { id: 'transport', label: 'Transportation', percentOfNeeds: 8 },
        { id: 'health', label: 'Health', percentOfNeeds: 6 },
        { id: 'debtmin', label: 'Minimum Debt Payments', percentOfNeeds: 4 },
        { id: 'misc', label: 'Misc Essentials / Contingency', percentOfNeeds: 2 }
    ];

    // State
    let salary = 0;
    let needsBucket = 0; // 50% of salary
    let items = [];
    let emi = 0;

    // Load or init
    function loadState(){
        const raw = localStorage.getItem(NEEDS_KEY);
        if(raw){
            try{ items = JSON.parse(raw); } catch(e){ items = null; }
        }
        if(!items){
            items = defaultItems.map(i=>({ ...i, value: 0, mode: 'amount' }));
        } else {
            // sanitize numeric fields to avoid strings causing logic errors
            items = items.map(it=>({
                ...it,
                value: Number(it.value) || 0,
                mode: it.mode || 'amount',
                percentOfNeeds: isFinite(Number(it.percentOfNeeds)) ? Number(it.percentOfNeeds) : (it.percentOfNeeds || 0),
                fromDefault: defaultItems.some(d => d.id === it.id) ? true : (it.fromDefault || false)
            }));
        }
    }

    function saveState(){
        localStorage.setItem(NEEDS_KEY, JSON.stringify(items));
    }

    function updateSalaryFromInput(){
        const v = Number((salaryInput.value||'').replace(/,/g,''));
        salary = isFinite(v) ? v : 0;
        needsBucket = salary * 0.5;
    }

    function computeDefaultsFromSalary(){
        items.forEach(it=>{
            if(it.mode === 'amount' && (Number(it.value) === 0 || it.fromDefault)){
                // compute default value from percentOfNeeds
                if(it.percentOfNeeds){
                    it.value = Math.round((it.percentOfNeeds/100) * needsBucket);
                    it.fromDefault = true;
                }
            }
        });
    }

    function renderItems(){
        needsItemsContainer.innerHTML = '';
        items.forEach((it, idx)=>{
            const wrapper = document.createElement('div');
            wrapper.className = 'bg-gray-50 p-3 rounded flex flex-col gap-2';
            wrapper.setAttribute('data-id', it.id || idx);

            const label = document.createElement('label');
            label.className = 'text-sm font-medium text-gray-800';
            const percentOfNeeds = needsBucket ? Math.round((it.value / needsBucket) * 100) : 0;
            label.textContent = `${it.label} (${percentOfNeeds}%)`;
            label.htmlFor = `input-${idx}`;

            const row = document.createElement('div');
            row.className = 'flex gap-2 items-center';

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${idx}`;
            input.value = fmt(it.value);
            input.className = 'flex-1 px-2 py-1 border border-gray-300 rounded';
            input.setAttribute('aria-label', it.label);

            // mode toggle
            const modeToggle = document.createElement('button');
            modeToggle.type = 'button';
            modeToggle.className = 'px-2 py-1 bg-white border rounded text-xs';
            modeToggle.textContent = it.mode === 'amount' ? 'Amount' : '% of Needs';
            modeToggle.title = 'Toggle input mode';

            // remove button (unless required)
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'px-2 py-1 bg-red-50 text-red-700 rounded text-xs';
            removeBtn.textContent = 'Remove';
            removeBtn.disabled = !!it.required;

            row.appendChild(input);
            row.appendChild(modeToggle);
            row.appendChild(removeBtn);

            const help = document.createElement('div');
            help.className = 'text-xs text-gray-500 flex justify-between items-center';
            help.innerHTML = `<span>${it.required ? 'Required' : 'Editable'}</span><span class="font-medium">% of total: ${needsBucket ? Math.round((it.value/salary||0)*100) : 0}%</span>`;

            wrapper.appendChild(label);
            wrapper.appendChild(row);
            wrapper.appendChild(help);

            needsItemsContainer.appendChild(wrapper);

            // Events
            input.addEventListener('input', e=>{
                const raw = e.target.value.replace(/,/g,'').trim();
                const num = Number(raw);
                if(isFinite(num)){
                    it.value = num;
                    it.mode = 'amount';
                    it.fromDefault = false;
                    saveState();
                    // Do not re-render entire list on every keystroke to preserve focus/caret
                    updateStatus();
                }
            });

            modeToggle.addEventListener('click', ()=>{
                if(it.mode === 'amount'){
                    // switch to percent mode
                    it.mode = 'percent';
                    it.percentOfNeeds = needsBucket ? Math.round((it.value/needsBucket)*100) : (it.percentOfNeeds||0);
                    modeToggle.textContent = '% of Needs';
                } else {
                    it.mode = 'amount';
                    it.value = Math.round((it.percentOfNeeds/100) * needsBucket);
                    modeToggle.textContent = 'Amount';
                }
                saveState();
                renderItems();
                updateStatus();
            });

            removeBtn.addEventListener('click', ()=>{
                if(it.required) return;
                items = items.filter(x=>x!==it);
                saveState();
                renderItems();
                updateStatus();
            });
        });
    }

    function updateStatus(){
        // Sum amounts; if item is in percent mode, compute amount from percentOfNeeds
        const total = items.reduce((s,it)=>{
            if(it.mode === 'percent'){
                const amt = needsBucket ? Math.round((Number(it.percentOfNeeds||0)/100) * needsBucket) : 0;
                return s + amt;
            }
            return s + (Number(it.value)||0);
        }, 0);
        const includedEmi = (includeEmiInNeeds.checked && emi > 0) ? emi : 0;
        const remaining = Math.round(needsBucket - total - includedEmi);
        // Difference is remaining (positive means unallocated available, negative means over-allocated)
        qsa('#difference50').forEach(el=>{
            el.textContent = fmt(remaining);
            if(remaining < 0){
                el.classList.remove('text-green-600');
                el.classList.add('text-red-700','font-bold');
            } else {
                el.classList.remove('text-red-700','font-bold');
                el.classList.add('text-green-600');
            }
        });

        // update displays
        qsa('#allocated50').forEach(el=>el.textContent = fmt(needsBucket));
        // Actual for 50 planner = sum of item values + EMI if included
        const actual50Value = total + includedEmi;
        qsa('#actual50').forEach(el=>el.textContent = fmt(actual50Value));
        qsa('#needsAmount').forEach(el=>el.textContent = fmt(total + includedEmi));
        qsa('#everydayAmount').forEach(el=>el.textContent = fmt(items.find(i=>i.id==='living')?.value || 0));
        qsa('#adjNeeds').forEach(el=>el.textContent = fmt(remaining));
        saveState();

        // Update differences for 30 and 20 as they use same borrowed values per requirement
        const salaryVal = salary || 0;
        const allocated30Val = Math.round(salaryVal * 0.3);
        const allocated20Val = Math.round(salaryVal * 0.2);
        // For this change, we borrow same values for each accordion: use actual50Value for others' actuals
        const actual30Val = 0;
        const monthly = parseCurrency(qs('#sipAmount').value);
        const years = parseInt(qs('#sipTenure').value) || 0;
        const invested = monthly * years * 12;
        const actual20Val = invested;

        // Update DOM
        qsa('#allocated30').forEach(el=>el.textContent = fmt(allocated30Val));
        qsa('#allocated20').forEach(el=>el.textContent = fmt(allocated20Val));
        qsa('#actual30').forEach(el=>el.textContent = fmt(actual30Val));
        qsa('#actual20').forEach(el=>el.textContent = fmt(actual20Val));

        // Differences
        const diff30 = Math.round(allocated30Val - actual30Val);
        const diff20 = Math.round(allocated20Val - actual20Val);

        qsa('#difference30').forEach(el=>{
            el.textContent = fmt(diff30);
            if(diff30 < 0){
                el.classList.remove('text-green-600');
                el.classList.add('text-red-700','font-bold');
            } else {
                el.classList.remove('text-red-700','font-bold');
                el.classList.add('text-green-600');
            }
        });

        qsa('#difference20').forEach(el=>{
            el.textContent = fmt(diff20);
            if(diff20 < 0){
                el.classList.remove('text-green-600');
                el.classList.add('text-red-700','font-bold');
            } else {
                el.classList.remove('text-red-700','font-bold');
                el.classList.add('text-green-600');
            }
        });
    }

    // EMI calculations
    function calcEmi(){
        const rawLoan = Number((loanAmount.value||'').replace(/,/g,''));
        const rawDown = Number((downpayment.value||'').replace(/,/g,''));
        const n = Number(tenure.value) || 0;
        const rawInterest = Number(interestRate.value) || 0;

        // Validate presence of essential inputs before computing EMI
        if(!(rawLoan > 0 && n > 0) ){
            emi = 0; loanResults.classList.add('hidden'); emiAmountDisplay.textContent = fmt(0); updateStatus(); return;
        }

        // Ensure downpayment is sane
        const down = isFinite(rawDown) ? rawDown : 0;
        if(down < 0 || down >= rawLoan){
            // not ready to compute EMI until valid downpayment provided (or zero)
            emi = 0; loanResults.classList.add('hidden'); emiAmountDisplay.textContent = fmt(0); updateStatus(); return;
        }

        const P = rawLoan - down;
        const r = rawInterest/1200; // monthly rate
        let monthly = 0;
        if(r === 0){
            monthly = P / n;
        } else {
            monthly = P * r * Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
        }
        emi = Math.round(monthly);
        loanResults.classList.remove('hidden');
        emiAmountDisplay.textContent = fmt(emi);

        // totals
        const totalPayment = Math.round(monthly * n);
        qs('#totalPayment').textContent = fmt(totalPayment);
        qs('#principalAmount').textContent = fmt(P);
        qs('#interestAmount').textContent = fmt(totalPayment - P);

        updateStatus();
    }

    // Add custom item flow
    function addCustomItem(){
        const name = prompt('Enter item name');
        if(!name) return;
        const suggestion = 5; // percent suggestion
        const it = { id: `custom_${Date.now()}`, label: name, percentOfNeeds: suggestion, mode: 'amount', value: Math.round((suggestion/100)*needsBucket) };
        items.push(it);
        saveState();
        renderItems();
        updateStatus();
    }

    function resetToDefaults(){
        items = defaultItems.map(i=>({ ...i, value: 0, mode: 'amount', fromDefault: true }));
        saveState();
        computeDefaultsFromSalary();
        renderItems();
        updateStatus();
    }

    // Wire events
    salaryInput.addEventListener('input', ()=>{
        updateSalaryFromInput();
        computeDefaultsFromSalary();
        renderItems();
        updateStatus();
        updateResults();
    });

    const debouncedCalc = debounce(calcEmi, 350);
    [loanAmount, tenure, interestRate, downpayment].forEach(el=> el.addEventListener('input', debouncedCalc));
    [loanAmount, tenure, interestRate, downpayment].forEach(el=> el.addEventListener('blur', calcEmi));
    includeEmiInNeeds.addEventListener('change', ()=> updateStatus());

    addNeedBtn.addEventListener('click', addCustomItem);
    resetNeedsBtn.addEventListener('click', resetToDefaults);

    // Init
    loadState();
    updateSalaryFromInput();
    computeDefaultsFromSalary();
    renderItems();
    // Ensure EMI is computed once on load so Difference/Actual are correct
    calcEmi();
    updateStatus();

})();