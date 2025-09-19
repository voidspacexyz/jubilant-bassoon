// filepath: /home/voidspacexyz/Work/personal/costplanner/js/wants.js
// Wants-specific logic for Money Planner (30% allocation, items, loan/EMI)

(function() {
    // Use common state and elements
    const { state, getElements, calculateEMI } = window.AppCommon;

    // Internal bridge to expose inner helpers
    const internals = {};

    function getCommonEls(){
        const e = getElements();
        return {
            allocated30: e.allocated30,
            actual30: e.actual30 || document.getElementById('actual30'),
            wantsAmount: document.getElementById('wantsAmount'),
            // header elements for the accordion/header display
            allocated30Header: e.allocated30Header || document.getElementById('allocated30-header'),
            actual30Header: e.actual30Header || document.getElementById('actual30-header')
        };
    }

    // Expose wants functions
    window.AppWants = {
        updateWantsLoan,
        initWants,
        updateWantsItems
    };

    function updateWantsLoan() {
        // For future: wants-specific loan UI/logic
        // Placeholder for now
    }

    function initWants() {
        // Wire any wants-specific events here
        // For now, just render items and loans
        internals.loadState && internals.loadState();
        internals.loadLoans && internals.loadLoans();
        internals.updateSalaryFromInput && internals.updateSalaryFromInput();
        internals.computeDefaultsFromSalary && internals.computeDefaultsFromSalary();
        internals.renderItems && internals.renderItems();
        internals.renderLoansUI && internals.renderLoansUI();
        internals.calcEmi && internals.calcEmi();
        internals.updateStatus && internals.updateStatus();
    }

    function updateWantsItems() {
        // call internal helpers if available
        internals.updateSalaryFromInput && internals.updateSalaryFromInput();
        internals.computeDefaultsFromSalary && internals.computeDefaultsFromSalary();
        internals.renderItems && internals.renderItems();
        internals.updateStatus && internals.updateStatus();
    }

    // Wants items feature (IIFE integrated)
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
        // For now, wants UI is not rendered, but can be extended here
        const wantsItemsContainer = qs('#wantsItems');
        const addWantBtn = qs('#addWantItem');
        const resetWantsBtn = qs('#resetWants');
        const includeEmiInWants = qs('#includeEmiInWants');
        const emiAmountDisplay = qs('#emiAmountWants');

        const WANTS_KEY = 'costplanner.wants.v1';
        const LOANS_KEY = 'costplanner.wantsloans.v1';

        // Default items (from financemodel.md)
        const defaultItems = [
            { id: 'dining', label: 'Dining Out', percentOfWants: 20 },
            { id: 'entertainment', label: 'Entertainment', percentOfWants: 20 },
            { id: 'travel', label: 'Travel', percentOfWants: 20 },
            { id: 'hobbies', label: 'Hobbies', percentOfWants: 15 },
            { id: 'luxury', label: 'Luxury Items', percentOfWants: 15 },
            { id: 'subscriptions', label: 'Subscriptions', percentOfWants: 10 }
        ];

        // State
        let items = [];
        let loans = [];
        let emi = 0; // aggregated EMI

        // Load/init: wants items
        function loadState(){
            const raw = localStorage.getItem(WANTS_KEY);
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
                    percentOfWants: isFinite(Number(it.percentOfWants)) ? Number(it.percentOfWants) : (it.percentOfWants || 0),
                    fromDefault: defaultItems.some(d => d.id === it.id) ? true : (it.fromDefault || false)
                }));
            }
        }

        function saveState(){
            localStorage.setItem(WANTS_KEY, JSON.stringify(items));
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
                includeInWants: !!l.includeInWants
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
            state.allocated[30] = state.salary * 0.3;
        }

        function computeDefaultsFromSalary(){
            items.forEach(it=>{
                if(it.mode === 'amount' && (Number(it.value) === 0 || it.fromDefault)){
                    if(it.percentOfWants){
                        it.value = Math.round((it.percentOfWants/100) * state.allocated[30]);
                        it.fromDefault = true;
                    }
                }
            });
        }

        // Loans UI (not rendered in HTML yet, but logic is here for future use)
        function renderLoansUI(){
            let wrapper = qs('#wantsLoansContainer');
            if(!wrapper){
                wrapper = document.createElement('div');
                wrapper.id = 'wantsLoansContainer';
                wrapper.className = 'space-y-3';
                // Insert before wantsLoanForm if present, else append to body
                const form = qs('#wantsLoanForm');
                if(form && form.parentNode){
                    form.insertBefore(wrapper, form.querySelector('#wantsLoanResults') || null);
                } else {
                    document.body.appendChild(wrapper);
                }
            }
            wrapper.innerHTML = '';

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
                lbl.addEventListener('input', e=>{ ln.label = e.target.value; saveLoans(); renderLoansUI(); calcEmiInternal(); });
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
                const includeChk = document.createElement('input'); includeChk.type='checkbox'; includeChk.checked = !!ln.includeInWants;
                includeChk.addEventListener('change', ()=>{ ln.includeInWants = includeChk.checked; saveLoans(); calcEmiInternal(); });
                includeWrap.appendChild(includeChk);
                includeWrap.appendChild(document.createTextNode('Include EMI in Wants'));

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
            addBtn.type='button'; addBtn.id='addWantsLoanBtn'; addBtn.className='px-3 py-2 bg-blue-600 text-white rounded'; addBtn.textContent='Add Loan';
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
            const label = prompt('Label for loan (e.g. Gadget loan, Vacation loan)') || `Loan ${loans.length+1}`;
            const suggestion = { amount:0, tenure:12, interest:10, downpayment:0 };
            const loan = { id: `loan_${Date.now()}`, label, ...suggestion, includeInWants: true };
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
                if(l.includeInWants) totalEmi += m;
            });
            emi = totalEmi;
            updateAggregatedEmiDisplay();
            // also update the old single-loan displays for backward compat
            qs('#wantsLoanResults') && qs('#wantsLoanResults').classList.toggle('hidden', loans.length===0);
            // Refresh wants status which uses emi
            updateStatus();
            saveLoans();
        }

        // Wants items rendering and status
        function renderItems(){
            if(!wantsItemsContainer) return;
            wantsItemsContainer.innerHTML = '';
            items.forEach((it, idx)=>{
                const wrapper = document.createElement('div');
                wrapper.className = 'bg-gray-50 p-3 rounded flex flex-col gap-2';
                wrapper.setAttribute('data-id', it.id || idx);

                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-gray-800';
                const percentOfWants = state.allocated[30] ? Math.round((it.value / state.allocated[30]) * 100) : 0;
                label.textContent = `${it.label} (${percentOfWants}%)`;
                label.htmlFor = `input-${idx}`;

                const row = document.createElement('div');
                row.className = 'flex gap-2 items-center';

                const input = document.createElement('input');
                input.type = 'text';
                input.id = `input-${idx}`;
                input.value = it.mode === 'amount' ? fmt(it.value) : fmt(it.percentOfWants || 0);
                input.className = 'flex-1 px-2 py-1 border border-gray-300 rounded';
                input.setAttribute('aria-label', it.label);

                const modeToggle = document.createElement('button');
                modeToggle.type = 'button';
                modeToggle.className = 'px-2 py-1 bg-white border rounded text-xs';
                modeToggle.textContent = it.mode === 'amount' ? 'Amount' : '% of Wants';
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
                help.innerHTML = `<span>${it.required ? 'Required' : 'Editable'}</span><span class="font-medium">% of total: ${state.allocated[30] ? Math.round((it.value/state.salary||0)*100) : 0}%</span>`;

                wrapper.appendChild(label);
                wrapper.appendChild(row);
                wrapper.appendChild(help);

                wantsItemsContainer.appendChild(wrapper);

                input.addEventListener('input', e=>{
                    const raw = e.target.value.replace(/,/g,'').trim();
                    const num = Number(raw);
                    if(isFinite(num)){
                        if(it.mode === 'amount'){
                            it.value = num;
                        } else {
                            it.percentOfWants = num;
                        }
                        it.fromDefault = false;
                        saveState();
                        updateStatus();
                    }
                });

                modeToggle.addEventListener('click', ()=>{
                    if(it.mode === 'amount'){
                        it.mode = 'percent';
                        it.percentOfWants = state.allocated[30] ? Math.round((it.value/state.allocated[30])*100) : (it.percentOfWants||0);
                        modeToggle.textContent = '% of Wants';
                    } else {
                        it.mode = 'amount';
                        it.value = Math.round((it.percentOfWants/100) * state.allocated[30]);
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
            const { allocated30, actual30, wantsAmount, allocated30Header, actual30Header } = getCommonEls() || {};
            const total = items.reduce((s,it)=>{
                if(it.mode === 'percent'){
                    const amt = state.allocated[30] ? Math.round((Number(it.percentOfWants||0)/100) * state.allocated[30]) : 0;
                    return s + amt;
                }
                return s + (Number(it.value)||0);
            }, 0);
            // Read the include-EMI checkbox state from the DOM
            const includeChkEl = document.getElementById('includeEmiInWants');
            const includeChecked = includeChkEl ? !!includeChkEl.checked : true;
            const includedEmi = (includeChecked && emi > 0) ? emi : 0;
            const remaining = Math.round(state.allocated[30] - total - includedEmi);
            qsa('#difference30, #difference30-header').forEach(el=>{
                el.textContent = fmt(remaining);
                if(remaining < 0){
                    el.classList.remove('text-green-600');
                    el.classList.add('text-red-700','font-bold');
                } else {
                    el.classList.remove('text-red-700','font-bold');
                    el.classList.add('text-green-600');
                }
            });

            if(allocated30) allocated30.textContent = fmt(state.allocated[30]);
            if(allocated30Header) allocated30Header.textContent = fmt(state.allocated[30]);

            state.actual[30] = total + includedEmi;
            if(actual30) actual30.textContent = fmt(state.actual[30]);
            if(actual30Header) actual30Header.textContent = fmt(state.actual[30]);

            if(wantsAmount) wantsAmount.textContent = fmt(total + includedEmi);
            saveState();
        }

        // internal calc with debounce
        const calcEmiInternal = debounce(()=>{
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
                if(l.includeInWants) totalEmi += m;
            });
            emi = totalEmi;
            updateAggregatedEmiDisplay();
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
            const suggestion = 10;
            const it = { id: `custom_${Date.now()}`, label: name, percentOfWants: suggestion, mode: 'amount', value: Math.round((suggestion/100)*state.allocated[30]) };
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
        includeEmiInWants && includeEmiInWants.addEventListener('change', ()=> updateStatus());
        addWantBtn && addWantBtn.addEventListener('click', addCustomItem);
        resetWantsBtn && resetWantsBtn.addEventListener('click', resetToDefaults);

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
        internals.loadLoans = loadLoans;
        internals.renderLoansUI = renderLoansUI;
    })();
})();