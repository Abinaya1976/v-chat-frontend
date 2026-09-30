import { useState } from 'react';
import TodoItem from './TodoItem';

import { TodoIcon } from '../common/Icons';

function TodoList({
  todos = [],
  loading = false,
  searchQuery = '',
  activeView = 'all',
  currentUserId,
  userRole,
  onToggleStatus,
  onEdit,
  onDelete,
  onNavigateToConversation,
  onNavigateToChannel,
  onNavigateToMessage,
  onOpenCreateModal,
  onAddToCalendar,
}) {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  if (loading) {
    return (
      <div className="todo-loading-state">
        <div className="spinner-medium" />
        <p>Loading to-dos...</p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="todo-empty-state">
        <div className="empty-icon-wrap">
          <TodoIcon size={32} color="var(--primary-accent)" />
        </div>
        <h4 className="empty-title">
          {searchQuery
            ? `No to-dos found for "${searchQuery}"`
            : activeView === 'my'
            ? "You don't have any assigned to-dos."
            : 'No to-dos yet'}
        </h4>
        <p className="empty-description">
          {searchQuery
            ? 'Try searching with different keywords or clearing your active filters.'
            : activeView === 'my'
            ? 'When tasks are assigned to you by teammates or created for yourself, they will appear here.'
            : 'Organize team projects, track deliverables, and manage action items right inside V Chat.'}
        </p>
        {!searchQuery && (
          <button
            type="button"
            className="btn-create-first-todo"
            onClick={onOpenCreateModal}
          >
            + Create your first To-Do
          </button>
        )}
      </div>
    );
  }

  const pendingTodos = todos.filter((t) => t.status !== 'completed');
  const completedTodos = todos.filter((t) => t.status === 'completed');

  return (
    <div className="todo-list-container">
      {/* 1. Pending Tasks Section */}
      {pendingTodos.length > 0 && (
        <section className="todo-section">
          <div className="todo-section-header">
            <span className="section-title">Pending</span>
          </div>
          <div className="todo-cards-grid">
            {pendingTodos.map((todo) => (
              <TodoItem
                key={todo._id || todo.id}
                todo={todo}
                currentUserId={currentUserId}
                userRole={userRole}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onNavigateToConversation={onNavigateToConversation}
                onNavigateToChannel={onNavigateToChannel}
                onNavigateToMessage={onNavigateToMessage}
                onAddToCalendar={onAddToCalendar}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Completed Tasks Section */}
      {completedTodos.length > 0 && (
        <section className="todo-section completed-section">
          <div
            className="todo-section-header clickable"
            onClick={() => setIsCompletedExpanded((prev) => !prev)}
          >
            <div className="header-left">
              <span className="expand-chevron">
                {isCompletedExpanded ? '▼' : '▶'}
              </span>
              <span className="section-title">Completed</span>
            </div>
          </div>

          {isCompletedExpanded && (
            <div className="todo-cards-grid">
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo._id || todo.id}
                  todo={todo}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onNavigateToConversation={onNavigateToConversation}
                  onNavigateToChannel={onNavigateToChannel}
                  onNavigateToMessage={onNavigateToMessage}
                  onAddToCalendar={onAddToCalendar}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default TodoList;
