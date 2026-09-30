import {
  SearchIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
} from '../common/Icons';

function ReminderFilters({
  activeFilter = 'all',
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  onOpenCreateModal,
  isPlanDisabled = false,
  counts = { all: 0, pending: 0, completed: 0 },
}) {
  return (
    <div className="reminder-filters-toolbar">
      <div className="reminder-filter-tabs">
        <button
          type="button"
          className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => onFilterChange('pending')}
        >
          Upcoming 
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          Completed 
        </button>
      </div>

      <div className="reminder-filter-right">
        <div className="reminder-search-input-wrapper">
          <SearchIcon size={15} className="search-input-icon" />
          <input
            type="text"
            className="reminder-search-input"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn-primary-create-reminder"
          onClick={onOpenCreateModal}
          disabled={isPlanDisabled}
        >
          <PlusIcon size={16} style={{ marginRight: 6 }} />
          Set Reminder
        </button>
      </div>
    </div>
  );
}

export default ReminderFilters;
