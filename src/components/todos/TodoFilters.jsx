function TodoFilters({
  activeView,
  onViewChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortOption,
  onSortChange,
  allCount = 0,
  myCount = 0,
}) {
  return (
    <div className="todo-filters-bar">
      {/* 1. Primary View Tabs (ALL vs MY TO-DOS) */}
      <div className="todo-view-tabs">
        <button
          type="button"
          className={`todo-tab-btn ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => onViewChange('all')}
        >
          <span>All</span>
        </button>

        <button
          type="button"
          className={`todo-tab-btn ${activeView === 'my' ? 'active' : ''}`}
          onClick={() => onViewChange('my')}
        >
          <span>My To-Dos</span>
        </button>
      </div>

      {/* 2. Secondary Dropdown Filters */}
      <div className="todo-filter-controls">
        {/* Status Filter */}
        <div className="filter-select-wrapper">
          <label htmlFor="todo-status-filter" className="todo-filter-label">
            Status
          </label>
          <select
            id="todo-status-filter"
            className="todo-filter-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="pending">Status: Pending</option>
            <option value="completed">Status: Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="filter-select-wrapper">
          <label htmlFor="todo-priority-filter" className="todo-filter-label">
            Priority
          </label>
          <select

            id="todo-priority-filter"
            className="todo-filter-select"
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
          >
            <option value="all">Priority: All</option>
            <option value="high">Priority: High</option>
            <option value="normal">Priority: Normal</option>
            <option value="low">Priority: Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default TodoFilters;
