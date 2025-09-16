// filepath: /home/voidspacexyz/Work/personal/costplanner/js/common.js
// Common shared state, DOM elements, and utilities for Money Planner

(function() {
    // Shared state object
    const state = {
        salary: 0,
        allocated: { 50: 0, 30: 0, 20: 0 },
        actual: { 50: 0, 30: 0, 20: 0 }
    };

    // DOM elements
    let salaryInput = document.getElementById('salary');
    let resultsBox = document.getElementById('results');
    let needsAmount = document.getElementById('needsAmount');
    let wantsAmount = document.getElementById('wantsAmount');
    let savingsAmount = document.getElementById('savingsAmount');
    let allocated50 = document.getElementById('allocated50');
    let allocated30 = document.getElementById('allocated30');
    let allocated20 = document.getElementById('allocated20');
    let actual50 = document.getElementById('actual50');
    let actual30 = document.getElementById('actual30');
    let actual20 = document.getElementById('actual20');
    let allocated50Header = document.getElementById('allocated50-header');
    let allocated30Header = document.getElementById('allocated30-header');
    let allocated20Header = document.getElementById('allocated20-header');
    let actual50Header = document.getElementById('actual50-header');
    let actual30Header = document.getElementById('actual30-header');
    let actual20Header = document.getElementById('actual20-header');
    let modal = document.getElementById('modal');
    let modalTitle = document.getElementById('modalTitle');
    let modalContent = document.getElementById('modalContent');
    let closeModal = document.getElementById('closeModal');
    let accordions = document.querySelectorAll('.accordion-header');

    // Expose state and elements globally for other modules
    window.AppCommon = {
        state,
        elements: {
            salaryInput,
            resultsBox,
            needsAmount,
            wantsAmount,
            savingsAmount,
            allocated50,
            allocated30,
            allocated20,
            actual50,
            actual30,
            actual20,
            allocated50Header,
            allocated30Header,
            allocated20Header,
            actual50Header,
            actual30Header,
            actual20Header,
            modal,
            modalTitle,
            modalContent,
            closeModal,
            accordions
        },
        // Return fresh element references (useful when scripts run before DOM readiness)
        getElements() {
            const get = id => document.getElementById(id);
            return {
                salaryInput: get('salary'),
                resultsBox: get('results'),
                needsAmount: get('needsAmount'),
                wantsAmount: get('wantsAmount'),
                savingsAmount: get('savingsAmount'),
                allocated50: get('allocated50'),
                allocated30: get('allocated30'),
                allocated20: get('allocated20'),
                actual50: get('actual50'),
                actual30: get('actual30'),
                actual20: get('actual20'),
                allocated50Header: get('allocated50-header'),
                allocated30Header: get('allocated30-header'),
                allocated20Header: get('allocated20-header'),
                actual50Header: get('actual50-header'),
                actual30Header: get('actual30-header'),
                actual20Header: get('actual20-header'),
                modal: get('modal'),
                modalTitle: get('modalTitle'),
                modalContent: get('modalContent'),
                closeModal: get('closeModal'),
                accordions: document.querySelectorAll('.accordion-header')
            };
        },
        updateResults,
        calculateEMI,
        showModal,
        initCommon
    };

    function updateResults() {
        // Use fresh DOM references to avoid errors if some elements are missing
        const elems = window.AppCommon ? window.AppCommon.getElements() : {
            salaryInput: document.getElementById('salary'),
            resultsBox: document.getElementById('results'),
            needsAmount: document.getElementById('needsAmount'),
            wantsAmount: document.getElementById('wantsAmount'),
            savingsAmount: document.getElementById('savingsAmount'),
            allocated50: document.getElementById('allocated50'),
            allocated30: document.getElementById('allocated30'),
            allocated20: document.getElementById('allocated20'),
            allocated50Header: document.getElementById('allocated50-header'),
            allocated30Header: document.getElementById('allocated30-header'),
            allocated20Header: document.getElementById('allocated20-header'),
            actual50: document.getElementById('actual50'),
            actual30: document.getElementById('actual30'),
            actual20: document.getElementById('actual20'),
            actual50Header: document.getElementById('actual50-header'),
            actual30Header: document.getElementById('actual30-header'),
            actual20Header: document.getElementById('actual20-header')
        };
        const salaryEl = elems.salaryInput || salaryInput;
        const resultsBoxEl = elems.resultsBox || resultsBox;
        const needsEl = elems.needsAmount || document.getElementById('allocated50') || allocated50;
        const wantsEl = elems.wantsAmount || document.getElementById('wantsAmount') || wantsAmount;
        const savingsEl = elems.savingsAmount || document.getElementById('savingsAmount') || savingsAmount;
        const alloc50El = elems.allocated50 || allocated50;
        const alloc30El = elems.allocated30 || allocated30;
        const alloc20El = elems.allocated20 || allocated20;
        const alloc50HeaderEl = elems.allocated50Header || allocated50Header;
        const alloc30HeaderEl = elems.allocated30Header || allocated30Header;
        const alloc20HeaderEl = elems.allocated20Header || allocated20Header;
        const actual50El = elems.actual50 || actual50;
        const actual30El = elems.actual30 || actual30;
        const actual20El = elems.actual20 || actual20;
        const actual50HeaderEl = elems.actual50Header || actual50Header;
        const actual30HeaderEl = elems.actual30Header || actual30Header;
        const actual20HeaderEl = elems.actual20Header || actual20Header;

        const salary = parseCurrency(salaryEl.value);
        if (salary <= 0) {
            resultsBoxEl.classList.add('hidden');
            if (alloc50El) alloc50El.textContent = alloc30El.textContent = alloc20El.textContent = formatCurrency(0, 0);
            if (needsEl) needsEl.textContent = wantsEl.textContent = savingsEl.textContent = formatCurrency(0, 0);
            if (actual50El) actual50El.textContent = actual30El.textContent = actual20El.textContent = formatCurrency(0, 0);
            if (alloc50HeaderEl) alloc50HeaderEl.textContent = alloc30HeaderEl.textContent = alloc20HeaderEl.textContent = formatCurrency(0, 0);
            if (actual50HeaderEl) actual50HeaderEl.textContent = actual30HeaderEl.textContent = actual20HeaderEl.textContent = formatCurrency(0, 0);
            state.salary = 0;
            state.allocated = { 50: 0, 30: 0, 20: 0 };
            state.actual = { 50: 0, 30: 0, 20: 0 };
            return;
        }
        resultsBoxEl.classList.remove('hidden');
        state.salary = salary;
        state.allocated[50] = salary * 0.5;
        state.allocated[30] = salary * 0.3;
        state.allocated[20] = salary * 0.2;
        if (needsEl) needsEl.textContent = formatCurrency(state.allocated[50], 0);
        if (wantsEl) wantsEl.textContent = formatCurrency(state.allocated[30], 0);
        if (savingsEl) savingsEl.textContent = formatCurrency(state.allocated[20], 0);
        if (alloc50El) alloc50El.textContent = formatCurrency(state.allocated[50], 0);
        if (alloc30El) alloc30El.textContent = formatCurrency(state.allocated[30], 0);
        if (alloc20El) alloc20El.textContent = formatCurrency(state.allocated[20], 0);
        if (alloc50HeaderEl) alloc50HeaderEl.textContent = formatCurrency(state.allocated[50], 0);
        if (alloc30HeaderEl) alloc30HeaderEl.textContent = formatCurrency(state.allocated[30], 0);
        if (alloc20HeaderEl) alloc20HeaderEl.textContent = formatCurrency(state.allocated[20], 0);
        // Trigger section-specific updates
        if (window.AppNeeds && window.AppNeeds.updateLoan) window.AppNeeds.updateLoan();
        if (window.AppSavings && window.AppSavings.updateSIP) window.AppSavings.updateSIP();
        if (window.AppWants && window.AppWants.updateWants) window.AppWants.updateWants();
        // Also trigger needs items update
        if (window.AppNeeds && window.AppNeeds.updateNeedsItems) window.AppNeeds.updateNeedsItems();
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

    function showModal(type) {
        // Use fresh elements for modal and values
        const elems = window.AppCommon ? window.AppCommon.getElements() : { modal: document.getElementById('modal'), modalTitle: document.getElementById('modalTitle'), modalContent: document.getElementById('modalContent'), needsAmount: document.getElementById('needsAmount'), wantsAmount: document.getElementById('wantsAmount'), savingsAmount: document.getElementById('savingsAmount') };
        const modalEl = elems.modal || modal;
        const modalTitleEl = elems.modalTitle || modalTitle;
        const modalContentEl = elems.modalContent || modalContent;
        const needsEl = elems.needsAmount || document.getElementById('allocated50') || needsAmount;
        const wantsEl = elems.wantsAmount || wantsAmount;
        const savingsEl = elems.savingsAmount || savingsAmount;

        let title = '';
        let content = '';
        if (type === 'needs') {
            title = '50% Needs Breakdown';
            content = `Needs allocation: ${needsEl ? needsEl.textContent : ''}`;
        } else if (type === 'wants') {
            title = '30% Wants Breakdown';
            content = `Wants allocation: ${wantsEl ? wantsEl.textContent : ''}`;
        } else if (type === 'savings') {
            title = '20% Savings/Debt Breakdown';
            content = `Savings allocation: ${savingsEl ? savingsEl.textContent : ''}`;
        }
        if (modalTitleEl) modalTitleEl.textContent = title;
        if (modalContentEl) modalContentEl.textContent = content;
        if (modalEl) {
            modalEl.classList.remove('translate-x-full');
            modalEl.classList.add('translate-x-0');
        }
    }

    function initCommon() {
        // Ensure DOM references are fresh (in case script ran before elements were ready)
        const get = id => document.getElementById(id);
        salaryInput = get('salary') || salaryInput;
        resultsBox = get('results') || resultsBox;
        needsAmount = get('needsAmount') || needsAmount;
        wantsAmount = get('wantsAmount') || wantsAmount;
        savingsAmount = get('savingsAmount') || savingsAmount;
        allocated50 = get('allocated50') || allocated50;
        allocated30 = get('allocated30') || allocated30;
        allocated20 = get('allocated20') || allocated20;
        actual50 = get('actual50') || actual50;
        actual30 = get('actual30') || actual30;
        actual20 = get('actual20') || actual20;
        allocated50Header = get('allocated50-header') || allocated50Header;
        allocated30Header = get('allocated30-header') || allocated30Header;
        allocated20Header = get('allocated20-header') || allocated20Header;
        actual50Header = get('actual50-header') || actual50Header;
        actual30Header = get('actual30-header') || actual30Header;
        actual20Header = get('actual20-header') || actual20Header;
        modal = get('modal') || modal;
        modalTitle = get('modalTitle') || modalTitle;
        modalContent = get('modalContent') || modalContent;
        closeModal = get('closeModal') || closeModal;
        accordions = document.querySelectorAll('.accordion-header') || accordions;

        // Wire shared events (guard against missing elements)
        if (salaryInput) {
            salaryInput.addEventListener('input', updateResults);
        }
        if (closeModal && modal) {
            closeModal.addEventListener('click', () => {
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
            });
        }

        // Use event delegation for accordions to ensure clicks are handled even if nodes change
        document.addEventListener('click', (event) => {
            const btn = event.target.closest && event.target.closest('.accordion-header');
            if (!btn) return;
            const body = btn.nextElementSibling;
            const chev = btn.querySelector('.chev');
            if (!body) return;
            const isOpen = !body.classList.contains('hidden');
            if (isOpen) {
                body.classList.add('hidden');
                if (chev) chev.classList.remove('rotate-180');
                btn.setAttribute('aria-expanded', 'false');
            } else {
                body.classList.remove('hidden');
                if (chev) chev.classList.add('rotate-180');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        // Initialize aria-expanded on headers
        accordions.forEach(btn => {
            if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
        });

        // If a salary value is already present on load, update all computed results
        try { updateResults(); } catch (e) { /* fail-safe: avoid breaking initialization */ }
    }

    // Ensure initCommon runs once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCommon);
    } else {
        initCommon();
    }

    // Utility functions
    function parseCurrency(value) {
        return parseFloat(value.replace(/[^0-9.-]+/g, ""));
    }

    function formatCurrency(amount, decimals) {
        if (isNaN(amount)) return '';
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function safeFloat(value) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
})();