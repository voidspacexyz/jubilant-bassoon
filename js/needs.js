// Needs-specific logic for Money Planner (50% allocation, items, loan/EMI)

(function() {
    // Use common state and elements
    const { state, getElements, calculateEMI } = window.AppCommon;

    // Internal bridge to expose inner helpers
    const internals = {};

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
            adjNeeds: document.getElementById('adjNeeds'),
            // header elements for the accordion/header display
            allocated50Header: e.allocated50Header || document.getElementById('allocated50-header'),
            actual50Header: e.actual50Header || document.getElementById('actual50-header')
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
        // Prefer using internal calc if available (it updates UI and state)
        if(internals.calcEmi && typeof internals.calcEmi === 'function'){
            internals.calcEmi();
            return;
        }
        const els = getCommonEls();
        if(!els.needsAmount) return; // bail if DOM not ready

        const loanAmt = Number((loanAmountInput?.value||'').replace(/,/g,'')) || 0;
        const down = Number((downpaymentInput?.value||'').replace(/,/g,'')) || 0;
        const principal = Math.max(0, loanAmt - down);
        const tenure = parseInt(tenureInput?.value) || 0;
        const rate = parseFloat(interestInput?.value) || 0;
        if (!loanResults || loanAmt <= 0 || tenure <= 0) {
            loanResults?.classList.add('hidden');
            if(emiAmount) emiAmount.textContent = new Intl.NumberFormat().format(0);
            if(totalPayment) totalPayment.textContent = new Intl.NumberFormat().format(0);
            if(principalAmount) principalAmount.textContent = new Intl.NumberFormat().format(0);
            if(interestAmount) interestAmount.textContent = new Intl.NumberFormat().format(0);
            state.actual[50] = 0;
            els.actual50.textContent = new Intl.NumberFormat().format(0);
            return;
        }
        const calc = calculateEMI(principal, tenure, rate);
        loanResults.classList.remove('hidden');
        emiAmount && (emiAmount.textContent = new Intl.NumberFormat().format(Math.round(calc.emi)));
        totalPayment && (totalPayment.textContent = new Intl.NumberFormat().format(Math.round(calc.totalPayment)));
        principalAmount && (principalAmount.textContent = new Intl.NumberFormat().format(Math.round(principal)));
        interestAmount && (interestAmount.textContent = new Intl.NumberFormat().format(Math.round(calc.totalInterest)));

        // Update needs-related displays
        const origNeeds = state.allocated[50];
        const everyday = origNeeds * 0.5;
        const planned = everyday + Math.round(calc.emi);
        els.everydayAmount && (els.everydayAmount.textContent = new Intl.NumberFormat().format(Math.round(everyday)));
        els.emiDeduction && (els.emiDeduction.textContent = new Intl.NumberFormat().format(Math.round(calc.emi)));
        els.plannedUsage && (els.plannedUsage.textContent = new Intl.NumberFormat().format(Math.round(planned)));
        const reserveAfter = origNeeds - planned;
        els.adjNeeds && (els.adjNeeds.textContent = new Intl.NumberFormat().format(Math.round(reserveAfter)));
        if (reserveAfter < 0) {
            els.adjNeeds && els.adjNeeds.classList.add('text-red-600', 'font-semibold');
        } else {
            els.adjNeeds && els.adjNeeds.classList.remove('text-red-600', 'font-semibold');
        }
        // Update actual50 (will be overridden by needs items if present)
        state.actual[50] = planned;
        els.actual50 && (els.actual50.textContent = new Intl.NumberFormat().format(Math.round(state.actual[50])));
    }

    function initNeeds() {
        cacheLoanEls();
        // If internals provide init behavior, call it
        if(internals && typeof internals.loadState === 'function'){
            // inner module already initialized on script load; ensure its event wiring is present
            // nothing to do here other than ensure calc runs once
            internals.calcEmi && internals.calcEmi();
        }
        // Wire loan events as fallback
        [loanAmountInput, tenureInput, interestInput, downpaymentInput].forEach(el => {
            if(el) el.addEventListener('input', updateLoan);
        });
    }

    function updateNeedsItems() {
        // call internal helpers if available
        if(internals && typeof internals.updateSalaryFromInput === 'function') internals.updateSalaryFromInput();
        if(internals && typeof internals.computeDefaultsFromSalary === 'function') internals.computeDefaultsFromSalary();
        if(internals && typeof internals.renderItems === 'function') internals.renderItems();
        if(internals && typeof internals.updateStatus === 'function') internals.updateStatus();
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
        const includeEmiInNeeds = qs('#includeEmiInNeeds');
        const emiAmountDisplay = qs('#emiAmount');

        const NEEDS_KEY = 'costplanner.needs.v1';
        const LOANS_KEY = 'costplanner.loans.v1';

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
        let loans = [];
        let emi = 0; // aggregated EMI

        // Load/init: needs items
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

        // Loan persistence
        function loadLoans(){
            const raw = localStorage.getItem(LOANS_KEY);
            if(raw){
                try{ loans = JSON.parse(raw); } catch(e){ loans = []; }
            }
            if(!Array.isArray(loans)) loans = [];
            // normalize
            loans = loans.map(l=>({
                id: l.id || `loan_${Date.now()}`,
                label: l.label || 'Loan',
                amount: Number(l.amount) || 0,
                tenure: Number(l.tenure) || 0,
                interest: Number(l.interest) || 0,
                downpayment: Number(l.downpayment) || 0,
                includeInNeeds: !!l.includeInNeeds
            }));
        }

        function saveLoans(){
            localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
        }

        // Update salary from outer input
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

        // Loans UI
        function renderLoansUI(){
            let wrapper = qs('#loansContainer');
            if(!wrapper){
                wrapper = document.createElement('div');
                wrapper.id = 'loansContainer';
                wrapper.className = 'space-y-3';
                // Insert before needsItemsContainer if present, else append to body
                if(needsItemsContainer && needsItemsContainer.parentNode){
                    needsItemsContainer.parentNode.insertBefore(wrapper, needsItemsContainer);
                } else {
                    document.body.appendChild(wrapper);
                }
            }
            wrapper.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'p-3 bg-yellow-50 border border-yellow-100 rounded';
            header.innerHTML = '<strong class="block">Loans (Needs)</strong><p class="text-sm text-gray-700">Only add loans here if they are absolutely necessary for living or servicing debt that cannot be moved to Wants. Consider adding discretionary loans or planned purchases under Wants instead.</p>';
            wrapper.appendChild(header);

            const list = document.createElement('div');
            list.className = 'space-y-2';

            loans.forEach((ln, idx)=>{
                const card = document.createElement('div');
                card.className = 'p-3 bg-white border rounded flex flex-col gap-2';
                card.setAttribute('data-id', ln.id);

                const topRow = document.createElement('div');
                topRow.className = 'flex items-center justify-between gap-2';

                const title = document.createElement('div');
                title.className = 'flex-1';
                const lbl = document.createElement('input');
                lbl.type = 'text';
                lbl.value = ln.label;
                lbl.className = 'w-full px-2 py-1 border rounded text-sm';
                lbl.setAttribute('aria-label', 'Loan label');
                lbl.addEventListener('input', e=>{ ln.label = e.target.value; saveLoans(); renderLoansUI(); });
                title.appendChild(lbl);

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'px-2 py-1 bg-red-50 text-red-600 rounded text-sm';
                removeBtn.textContent = 'Remove';
                removeBtn.addEventListener('click', ()=>{ loans.splice(idx,1); saveLoans(); renderLoansUI(); calcEmiInternal(); });

                topRow.appendChild(title);
                topRow.appendChild(removeBtn);

                const row = document.createElement('div');
                row.className = 'grid grid-cols-2 md:grid-cols-4 gap-2';

                const amt = document.createElement('input'); amt.type='text'; amt.value = fmt(ln.amount); amt.className='px-2 py-1 border rounded'; amt.setAttribute('aria-label','Loan amount');
                const ten = document.createElement('input'); ten.type='number'; ten.value = ln.tenure || ''; ten.className='px-2 py-1 border rounded'; ten.setAttribute('aria-label','Tenure (months)');
                const intr = document.createElement('input'); intr.type='number'; intr.value = ln.interest || ''; intr.className='px-2 py-1 border rounded'; intr.setAttribute('aria-label','Interest (%)');
                const down = document.createElement('input'); down.type='text'; down.value = fmt(ln.downpayment); down.className='px-2 py-1 border rounded'; down.setAttribute('aria-label','Downpayment');

                amt.addEventListener('input', e=>{ const v = Number(e.target.value.replace(/,/g,'')); ln.amount = isFinite(v)?v:0; saveLoans(); requestCalc(); });
                ten.addEventListener('input', e=>{ ln.tenure = Number(e.target.value)||0; saveLoans(); requestCalc(); });
                intr.addEventListener('input', e=>{ ln.interest = Number(e.target.value)||0; saveLoans(); requestCalc(); });
                down.addEventListener('input', e=>{ const v = Number(e.target.value.replace(/,/g,'')); ln.downpayment = isFinite(v)?v:0; saveLoans(); requestCalc(); });

                row.appendChild(amt);
                row.appendChild(ten);
                row.appendChild(intr);
                row.appendChild(down);

                const foot = document.createElement('div');
                foot.className = 'flex items-center justify-between gap-2';

                const includeWrap = document.createElement('label');
                includeWrap.className = 'flex items-center gap-2 text-sm';
                const includeChk = document.createElement('input'); includeChk.type='checkbox'; includeChk.checked = !!ln.includeInNeeds;
                includeChk.addEventListener('change', ()=>{ ln.includeInNeeds = includeChk.checked; saveLoans(); calcEmiInternal(); });
                includeWrap.appendChild(includeChk);
                includeWrap.appendChild(document.createTextNode('Include EMI in Needs'));

                const emiDisplay = document.createElement('div'); emiDisplay.className='text-sm font-medium'; emiDisplay.textContent = 'EMI: ' + fmt(0); emiDisplay.setAttribute('data-emi','0');

                foot.appendChild(includeWrap);
                foot.appendChild(emiDisplay);

                card.appendChild(topRow);
                card.appendChild(row);
                card.appendChild(foot);

                list.appendChild(card);
            });

            wrapper.appendChild(list);

            const controls = document.createElement('div');
            controls.className = 'flex gap-2';
            const addBtn = document.createElement('button');
            addBtn.type='button'; addBtn.id='addLoanBtn'; addBtn.className='px-3 py-2 bg-blue-600 text-white rounded'; addBtn.textContent='Add Loan';
            addBtn.addEventListener('click', addLoan);
            controls.appendChild(addBtn);

            if(loans.length>0){
                const clearBtn = document.createElement('button');
                clearBtn.type='button'; clearBtn.className='px-3 py-2 bg-red-50 text-red-600 rounded'; clearBtn.textContent='Clear All Loans';
                clearBtn.addEventListener('click', ()=>{ if(confirm('Remove all loans?')){ loans = []; saveLoans(); renderLoansUI(); calcEmiInternal(); } });
                controls.appendChild(clearBtn);
            }

            wrapper.appendChild(controls);

            // Update any displayed aggregated EMI at top-level
            updateAggregatedEmiDisplay();
        }

        function addLoan(){
            const label = prompt('Label for loan (e.g. Home loan, Car loan)') || `Loan ${loans.length+1}`;
            const suggestion = { amount:0, tenure:60, interest:8, downpayment:0 };
            const loan = { id: `loan_${Date.now()}`, label, ...suggestion, includeInNeeds: true };
            loans.push(loan);
            saveLoans();
            renderLoansUI();
            calcEmiInternal();
        }

        function updateAggregatedEmiDisplay(){
            if(emiAmountDisplay) emiAmountDisplay.textContent = fmt(emi);
        }

        function calcEmi(){
            // compute EMI per loan and aggregate
            let totalEmi = 0;
            loans.forEach((l)=>{
                const loanAmt = Math.max(0, (Number(l.amount) || 0) - (Number(l.downpayment)||0));
                const n = Number(l.tenure) || 0;
                const r = Number(l.interest) || 0;
                let monthly = 0;
                if(!(loanAmt>0 && n>0)){
                    monthly = 0;
                } else {
                    const rr = r/1200;
                    if(rr === 0){ monthly = loanAmt / n; } else { monthly = loanAmt * rr * Math.pow(1+rr,n)/(Math.pow(1+rr,n)-1); }
                }
                const m = Math.round(monthly);
                // update card display if present
                const card = qs(`[data-id="${l.id}"]`);
                if(card){
                    const emiEl = card.querySelector('[data-emi]');
                    emiEl && (emiEl.textContent = 'EMI: ' + fmt(m));
                }
                // include in aggregate only if flagged
                if(l.includeInNeeds) totalEmi += m;
            });
            emi = totalEmi;
            updateAggregatedEmiDisplay();
            // update other loan result fields if they exist
            qs('#loanResults') && qs('#loanResults').classList.toggle('hidden', loans.length===0);
            // also update the old single-loan displays for backward compat
            qs('#emiAmount') && (qs('#emiAmount').textContent = fmt(emi));
            // Refresh needs status which uses emi
            updateStatus();
            saveLoans();
        }

        // Needs items rendering and status (mostly reused)
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
            const { allocated50, actual50, needsAmount, allocated50Header, actual50Header } = getCommonEls() || {};
            const total = items.reduce((s,it)=>{
                if(it.mode === 'percent'){
                    const amt = state.allocated[50] ? Math.round((Number(it.percentOfNeeds||0)/100) * state.allocated[50]) : 0;
                    return s + amt;
                }
                return s + (Number(it.value)||0);
            }, 0);
            // Read the include-EMI checkbox state directly from the DOM each time
            const includeChkEl = document.getElementById('includeEmiInNeeds');
            const includeChecked = includeChkEl ? !!includeChkEl.checked : true;
            const includedEmi = (includeChecked && emi > 0) ? emi : 0;
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
            // keep header allocated in sync
            if(allocated50Header) allocated50Header.textContent = fmt(state.allocated[50]);

            state.actual[50] = total + includedEmi;
            if(actual50) actual50.textContent = fmt(state.actual[50]);
            // update header actual as well
            if(actual50Header) actual50Header.textContent = fmt(state.actual[50]);

            if(needsAmount) needsAmount.textContent = fmt(total + includedEmi);
            const everydayEl = document.getElementById('everydayAmount');
            const adjEl = document.getElementById('adjNeeds');
            if(everydayEl) everydayEl.textContent = fmt(items.find(i=>i.id==='living')?.value || 0);
            if(adjEl) adjEl.textContent = fmt(remaining);
            saveState();
        }

        // internal calc with debounce
        const calcEmiInternal = debounce(()=>{
            // reuse the main calculation implementation
            let totalEmi = 0;
            loans.forEach((l)=>{
                const loanAmt = Math.max(0, (Number(l.amount) || 0) - (Number(l.downpayment)||0));
                const n = Number(l.tenure) || 0;
                const r = Number(l.interest) || 0;
                let monthly = 0;
                if(!(loanAmt>0 && n>0)){
                    monthly = 0;
                } else {
                    const rr = r/1200;
                    if(rr === 0){ monthly = loanAmt / n; } else { monthly = loanAmt * rr * Math.pow(1+rr,n)/(Math.pow(1+rr,n)-1); }
                }
                const m = Math.round(monthly);
                if(l.includeInNeeds) totalEmi += m;
            });
            emi = totalEmi;
            updateAggregatedEmiDisplay();
            qs('#emiAmount') && (qs('#emiAmount').textContent = fmt(emi));
            updateStatus();
            saveLoans();
        }, 250);

        // Safe request to calculate EMI — uses calcEmiInternal if available, otherwise schedules a short retry
        function requestCalc(){
            try{
                if(typeof calcEmiInternal === 'function'){
                    calcEmiInternal();
                } else {
                    setTimeout(()=>{ if(typeof calcEmiInternal === 'function') calcEmiInternal(); }, 50);
                }
            }catch(e){
                setTimeout(()=>{ if(typeof calcEmiInternal === 'function') calcEmiInternal(); }, 50);
            }
        }

        const debouncedCalc = calcEmiInternal;

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
        // Reuse any existing input elements for backward compat by binding changes to recalc loans
        ['loanAmount','tenure','interestRate','downpayment'].forEach(id=>{
            const el = qs('#'+id);
            if(el) el.addEventListener('input', ()=>{ /* prefer new multi-loan UI, but fallback */ calcEmiInternal(); });
        });

        includeEmiInNeeds && includeEmiInNeeds.addEventListener('change', ()=> updateStatus());

        addNeedBtn && addNeedBtn.addEventListener('click', addCustomItem);
        resetNeedsBtn && resetNeedsBtn.addEventListener('click', resetToDefaults);

        // Init
        loadState();
        loadLoans();
        updateSalaryFromInput();
        computeDefaultsFromSalary();
        renderItems();
        renderLoansUI();
        calcEmiInternal();
        updateStatus();

        // expose internals for outer scope
        internals.loadState = loadState;
        internals.updateSalaryFromInput = updateSalaryFromInput;
        internals.computeDefaultsFromSalary = computeDefaultsFromSalary;
        internals.renderItems = renderItems;
        internals.updateStatus = updateStatus;
        internals.calcEmi = calcEmiInternal;
        internals.getItems = () => items;
        internals.getEmi = () => emi;
    })();
})();