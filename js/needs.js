// Needs-specific logic for Money Planner (50% allocation, items, loan/EMI)

(function() {
    // Use common state and elements
    const { state, getElements, calculateEMI } = window.AppCommon;

    function getCommonEls(){
        const e = getElements();
        return {
            salaryInput: e.salaryInput,
            allocated50: e.allocated50,
            actual50: e.actual50,
            needsAmount: e.needsAmount,
            everydayAmount: document.getElementById('everydayAmount'),
            emiDeduction: document.getElementById('emiDeduction'),
            plannedUsage: document.getElementById('plannedUsage'),
            adjNeeds: document.getElementById('adjNeeds')
        };
    }

    // grab elements when needed
    let loanAmountInput, tenureInput, interestInput, downpaymentInput, loanResults, emiAmount, totalPayment, principalAmount, interestAmount;

    function cacheLoanEls(){
        loanAmountInput = document.getElementById('loanAmount');
        tenureInput = document.getElementById('tenure');
        interestInput = document.getElementById('interestRate');
        downpaymentInput = document.getElementById('downpayment');
        loanResults = document.getElementById('loanResults');
        emiAmount = document.getElementById('emiAmount');
        totalPayment = document.getElementById('totalPayment');
        principalAmount = document.getElementById('principalAmount');
        interestAmount = document.getElementById('interestAmount');
    }

    // Expose needs functions
    window.AppNeeds = {
        updateLoan,
        initNeeds,
        updateNeedsItems
    };

    function updateLoan() {
        cacheLoanEls();
        const els = getCommonEls();
        if(!els.needsAmount) return; // bail if DOM not ready

        const loanAmt = parseCurrency(loanAmountInput?.value);
        const down = parseCurrency(downpaymentInput?.value);
        const principal = Math.max(0, loanAmt - down);
        const tenure = parseInt(tenureInput?.value) || 0;
        const rate = parseFloat(interestInput?.value) || 0;
        if (!loanResults || loanAmt <= 0 || tenure <= 0) {
            loanResults?.classList.add('hidden');
            if(emiAmount) emiAmount.textContent = formatCurrency(0,0);
            if(totalPayment) totalPayment.textContent = formatCurrency(0,0);
            if(principalAmount) principalAmount.textContent = formatCurrency(0,0);
            if(interestAmount) interestAmount.textContent = formatCurrency(0,0);
            state.actual[50] = 0;
            els.actual50.textContent = formatCurrency(0, 0);
            return;
        }
        const calc = calculateEMI(principal, tenure, rate);
        loanResults.classList.remove('hidden');
        emiAmount && (emiAmount.textContent = formatCurrency(calc.emi, 0));
        totalPayment && (totalPayment.textContent = formatCurrency(calc.totalPayment, 0));
        principalAmount && (principalAmount.textContent = formatCurrency(principal, 0));
        interestAmount && (interestAmount.textContent = formatCurrency(calc.totalInterest, 0));

        // Update needs-related displays
        const origNeeds = state.allocated[50];
        const everyday = origNeeds * 0.5;
        const planned = everyday + calc.emi;
        els.everydayAmount && (els.everydayAmount.textContent = formatCurrency(everyday, 0));
        els.emiDeduction && (els.emiDeduction.textContent = formatCurrency(calc.emi, 0));
        els.plannedUsage && (els.plannedUsage.textContent = formatCurrency(planned, 0));
        const reserveAfter = origNeeds - planned;
        els.adjNeeds && (els.adjNeeds.textContent = formatCurrency(reserveAfter, 0));
        if (reserveAfter < 0) {
            els.adjNeeds && els.adjNeeds.classList.add('text-red-600', 'font-semibold');
        } else {
            els.adjNeeds && els.adjNeeds.classList.remove('text-red-600', 'font-semibold');
        }
        // Update actual50 (will be overridden by needs items if present)
        state.actual[50] = planned;
        els.actual50 && (els.actual50.textContent = formatCurrency(state.actual[50], 0));
    }

    function initNeeds() {
        cacheLoanEls();
        // Wire loan events
        [loanAmountInput, tenureInput, interestInput, downpaymentInput].forEach(el => {
            if(el) el.addEventListener('input', updateLoan);
        });
    }

    function updateNeedsItems() {
        // these helper functions are inside the IIFE; ensure they exist before calling
        if(typeof updateSalaryFromInput === 'function') updateSalaryFromInput();
        if(typeof computeDefaultsFromSalary === 'function') computeDefaultsFromSalary();
        if(typeof renderItems === 'function') renderItems();
        if(typeof updateStatus === 'function') updateStatus();
    }

    // Needs items feature (IIFE integrated)
    (function() {
        // Utilities
        const qs = (s, el=document) => el.querySelector(s);
        const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
        const fmt = (v) => new Intl.NumberFormat().format(Number(v) || 0);
        const debounce = (fn, wait=300) => {
            let t;
            return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
        };

        // Elements (local queries)
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

        // Default items
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
        let items = [];
        let emi = 0;

        // Load/init
        function loadState(){
            const raw = localStorage.getItem(NEEDS_KEY);
            if(raw){
                try{ items = JSON.parse(raw); } catch(e){ items = null; }
            }
            if(!items){
                items = defaultItems.map(i=>({ ...i, value: 0, mode: 'amount' }));
            } else {
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
            const { salaryInput } = getCommonEls() || {};
            const v = Number((salaryInput?.value||'').replace(/,/g,''));
            state.salary = isFinite(v) ? v : 0;
            state.allocated[50] = state.salary * 0.5;
        }

        function computeDefaultsFromSalary(){
            items.forEach(it=>{
                if(it.mode === 'amount' && (Number(it.value) === 0 || it.fromDefault)){
                    if(it.percentOfNeeds){
                        it.value = Math.round((it.percentOfNeeds/100) * state.allocated[50]);
                        it.fromDefault = true;
                    }
                }
            });
        }

        function renderItems(){
            if(!needsItemsContainer) return;
            needsItemsContainer.innerHTML = '';
            items.forEach((it, idx)=>{
                const wrapper = document.createElement('div');
                wrapper.className = 'bg-gray-50 p-3 rounded flex flex-col gap-2';
                wrapper.setAttribute('data-id', it.id || idx);

                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-gray-800';
                const percentOfNeeds = state.allocated[50] ? Math.round((it.value / state.allocated[50]) * 100) : 0;
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

                const modeToggle = document.createElement('button');
                modeToggle.type = 'button';
                modeToggle.className = 'px-2 py-1 bg-white border rounded text-xs';
                modeToggle.textContent = it.mode === 'amount' ? 'Amount' : '% of Needs';
                modeToggle.title = 'Toggle input mode';

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
                help.innerHTML = `<span>${it.required ? 'Required' : 'Editable'}</span><span class="font-medium">% of total: ${state.allocated[50] ? Math.round((it.value/state.salary||0)*100) : 0}%</span>`;

                wrapper.appendChild(label);
                wrapper.appendChild(row);
                wrapper.appendChild(help);

                needsItemsContainer.appendChild(wrapper);

                input.addEventListener('input', e=>{
                    const raw = e.target.value.replace(/,/g,'').trim();
                    const num = Number(raw);
                    if(isFinite(num)){
                        it.value = num;
                        it.mode = 'amount';
                        it.fromDefault = false;
                        saveState();
                        updateStatus();
                    }
                });

                modeToggle.addEventListener('click', ()=>{
                    if(it.mode === 'amount'){
                        it.mode = 'percent';
                        it.percentOfNeeds = state.allocated[50] ? Math.round((it.value/state.allocated[50])*100) : (it.percentOfNeeds||0);
                        modeToggle.textContent = '% of Needs';
                    } else {
                        it.mode = 'amount';
                        it.value = Math.round((it.percentOfNeeds/100) * state.allocated[50]);
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
            const { allocated50, actual50, needsAmount } = getCommonEls() || {};
            const total = items.reduce((s,it)=>{
                if(it.mode === 'percent'){
                    const amt = state.allocated[50] ? Math.round((Number(it.percentOfNeeds||0)/100) * state.allocated[50]) : 0;
                    return s + amt;
                }
                return s + (Number(it.value)||0);
            }, 0);
            const includedEmi = (includeEmiInNeeds?.checked && emi > 0) ? emi : 0;
            const remaining = Math.round(state.allocated[50] - total - includedEmi);
            qsa('#difference50, #difference50-header').forEach(el=>{
                el.textContent = fmt(remaining);
                if(remaining < 0){
                    el.classList.remove('text-green-600');
                    el.classList.add('text-red-700','font-bold');
                } else {
                    el.classList.remove('text-red-700','font-bold');
                    el.classList.add('text-green-600');
                }
            });

            if(allocated50) allocated50.textContent = fmt(state.allocated[50]);
            state.actual[50] = total + includedEmi;
            if(actual50) actual50.textContent = fmt(state.actual[50]);
            if(needsAmount) needsAmount.textContent = fmt(total + includedEmi);
            const everydayEl = document.getElementById('everydayAmount');
            const adjEl = document.getElementById('adjNeeds');
            if(everydayEl) everydayEl.textContent = fmt(items.find(i=>i.id==='living')?.value || 0);
            if(adjEl) adjEl.textContent = fmt(remaining);
            saveState();
        }

        function calcEmi(){
            const rawLoan = Number((loanAmount?.value||'').replace(/,/g,''));
            const rawDown = Number((downpayment?.value||'').replace(/,/g,''));
            const n = Number(tenure?.value) || 0;
            const rawInterest = Number(interestRate?.value) || 0;

            if(!(rawLoan > 0 && n > 0) ){
                emi = 0; loanResults?.classList.add('hidden'); if(emiAmountDisplay) emiAmountDisplay.textContent = fmt(0); updateStatus(); return;
            }

            const down = isFinite(rawDown) ? rawDown : 0;
            if(down < 0 || down >= rawLoan){
                emi = 0; loanResults?.classList.add('hidden'); if(emiAmountDisplay) emiAmountDisplay.textContent = fmt(0); updateStatus(); return;
            }

            const P = rawLoan - down;
            const r = rawInterest/1200;
            let monthly = 0;
            if(r === 0){
                monthly = P / n;
            } else {
                monthly = P * r * Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            emi = Math.round(monthly);
            loanResults?.classList.remove('hidden');
            if(emiAmountDisplay) emiAmountDisplay.textContent = fmt(emi);

            const totalPayment = Math.round(monthly * n);
            qs('#totalPayment') && (qs('#totalPayment').textContent = fmt(totalPayment));
            qs('#principalAmount') && (qs('#principalAmount').textContent = fmt(P));
            qs('#interestAmount') && (qs('#interestAmount').textContent = fmt(totalPayment - P));

            updateStatus();
        }

        function addCustomItem(){
            const name = prompt('Enter item name');
            if(!name) return;
            const suggestion = 5;
            const it = { id: `custom_${Date.now()}`, label: name, percentOfNeeds: suggestion, mode: 'amount', value: Math.round((suggestion/100)*state.allocated[50]) };
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
        const debouncedCalc = debounce(calcEmi, 350);
        [loanAmount, tenure, interestRate, downpayment].forEach(el=> el && el.addEventListener('input', debouncedCalc));
        [loanAmount, tenure, interestRate, downpayment].forEach(el=> el && el.addEventListener('blur', calcEmi));
        includeEmiInNeeds && includeEmiInNeeds.addEventListener('change', ()=> updateStatus());

        addNeedBtn && addNeedBtn.addEventListener('click', addCustomItem);
        resetNeedsBtn && resetNeedsBtn.addEventListener('click', resetToDefaults);

        // Init
        loadState();
        updateSalaryFromInput();
        computeDefaultsFromSalary();
        renderItems();
        calcEmi();
        updateStatus();
    })();
})();