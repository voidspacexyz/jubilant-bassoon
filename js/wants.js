// filepath: /home/voidspacexyz/Work/personal/costplanner/js/wants.js
// Wants-specific logic for Money Planner (30% allocation)

(function() {
    // Use common state
    const { state, elements } = window.AppCommon;
    const { actual30, allocated30 } = elements;

    // Expose wants functions
    window.AppWants = {
        updateWants,
        initWants
    };

    function updateWants() {
        // For now, wants are simple; just ensure allocated is updated
        // Future: Add wants-specific features like expense tracking
        allocated30.textContent = formatCurrency(state.allocated[30], 0);
        allocated30Header.textContent = formatCurrency(state.allocated[30], 0);
        // Actual30 is 0 unless specific wants are tracked
        state.actual[30] = 0;
        actual30.textContent = formatCurrency(state.actual[30], 0);
        actual30Header.textContent = formatCurrency(state.actual[30], 0);
    }

    function initWants() {
        // Wire any wants-specific events here (none for now)
        updateWants();
    }
})();