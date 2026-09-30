import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import TodoFilters from './TodoFilters';
import TodoList from './TodoList';
import TodoModal from './TodoModal';
import { TodoIcon, SearchIcon } from '../common/Icons';
import {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
} from '../../services/todoService';

function TodoPage({
  availableUsers = [],
  onNavigateToConversation,
  onNavigateToChannel,
  onNavigateToMessage,
  // If opened with pre-set context (e.g. from chat header or message action)
  contextData = null,
  isCreateModalOpenExternal = false,
  onCloseCreateModalExternal,
  isPlanDisabled = false,
  isExpired = false,
  isSuspended = false,
  onAddToCalendar,
}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const currentUserId = (user?.id || user?._id)?.toString();

  // Filter and Query States
  const [activeView, setActiveView] = useState('all'); // 'all' | 'my'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOption, setSortOption] = useState('default');

  // Database Data States
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allCount, setAllCount] = useState(0);
  const [myCount, setMyCount] = useState(0);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [modalContext, setModalContext] = useState(null);

  const searchDebounceRef = useRef(null);

  // 1. Fetch To-Dos from API
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        view: activeView,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        sort: sortOption,
        search: searchQuery.trim() || undefined,
      };

      const data = await getTodos(params);
      if (data.success) {
        setTodos(data.todos || []);
      }

      // Fetch summary counts for the tabs
      const [allData, myData] = await Promise.all([
        getTodos({ view: 'all' }),
        getTodos({ view: 'my' }),
      ]);
      if (allData.success) {
        setAllCount(allData.todos?.filter((t) => t.status !== 'completed').length || 0);
      }
      if (myData.success) {
        setMyCount(myData.todos?.filter((t) => t.status !== 'completed').length || 0);
      }
    } catch (err) {
      console.error('Failed to load To-Dos:', err.message);
      const isSubError =
        err.response?.data?.code === 'ORG_SUSPENDED' ||
        err.response?.data?.code === 'ORG_EXPIRED' ||
        err.response?.data?.companyStatus === 'suspended' ||
        err.response?.data?.companyStatus === 'expired';
      if (!isSubError && !isPlanDisabled) {
        setError(err.response?.data?.message || 'Failed to load To-Dos');
      }
    } finally {
      setLoading(false);
    }
  }, [activeView, statusFilter, priorityFilter, sortOption, searchQuery, isPlanDisabled]);

  // Trigger fetch on filter change
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Debounced search handling
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  // Sync external create modal triggers (e.g. from chat header or message actions)
  useEffect(() => {
    if (isCreateModalOpenExternal && !isPlanDisabled) {
      setEditingTodo(null);
      setModalContext(contextData);
      setIsModalOpen(true);
    }
  }, [isCreateModalOpenExternal, contextData, isPlanDisabled]);

  // 2. Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleTodoCreated = ({ todo }) => {
      if (!todo) return;
      const creatorId = (todo.createdBy?._id || todo.createdBy)?.toString();
      const assigneeId = (todo.assignedTo?._id || todo.assignedTo)?.toString();
      const isPersonal = Boolean(creatorId && assigneeId && creatorId === assigneeId);

      // Other users must not see or receive personal To-Dos
      if (isPersonal && creatorId !== currentUserId) {
        return;
      }

      setTodos((prev) => {
        const exists = prev.some((t) => (t._id || t.id).toString() === (todo._id || todo.id).toString());
        if (exists) return prev;
        return [todo, ...prev];
      });
      // Update badge counts
      if (assigneeId === currentUserId) {
        setMyCount((c) => c + 1);
      }
      if (!isPersonal || creatorId === currentUserId) {
        setAllCount((c) => c + 1);
      }
    };

    const handleTodoUpdated = ({ todo }) => {
      if (!todo) return;
      const creatorId = (todo.createdBy?._id || todo.createdBy)?.toString();
      const assigneeId = (todo.assignedTo?._id || todo.assignedTo)?.toString();
      const isPersonal = Boolean(creatorId && assigneeId && creatorId === assigneeId);

      if (isPersonal && creatorId !== currentUserId) {
        setTodos((prev) =>
          prev.filter((t) => (t._id || t.id).toString() !== (todo._id || todo.id).toString())
        );
        return;
      }

      setTodos((prev) =>
        prev.map((t) =>
          (t._id || t.id).toString() === (todo._id || todo.id).toString() ? todo : t
        )
      );
    };

    const handleTodoCompleted = ({ todo }) => {
      if (!todo) return;
      const creatorId = (todo.createdBy?._id || todo.createdBy)?.toString();
      const assigneeId = (todo.assignedTo?._id || todo.assignedTo)?.toString();
      const isPersonal = Boolean(creatorId && assigneeId && creatorId === assigneeId);

      if (isPersonal && creatorId !== currentUserId) {
        setTodos((prev) =>
          prev.filter((t) => (t._id || t.id).toString() !== (todo._id || todo.id).toString())
        );
        return;
      }

      setTodos((prev) =>
        prev.map((t) =>
          (t._id || t.id).toString() === (todo._id || todo.id).toString() ? todo : t
        )
      );
    };

    const handleTodoDeleted = ({ todoId, assignedTo }) => {
      if (!todoId) return;
      setTodos((prev) =>
        prev.filter((t) => (t._id || t.id).toString() !== todoId.toString())
      );
      if (assignedTo?.toString() === currentUserId) {
        setMyCount((c) => Math.max(0, c - 1));
      }
      setAllCount((c) => Math.max(0, c - 1));
    };

    socket.on('todo:created', handleTodoCreated);
    socket.on('todo:updated', handleTodoUpdated);
    socket.on('todo:completed', handleTodoCompleted);
    socket.on('todo:deleted', handleTodoDeleted);

    return () => {
      socket.off('todo:created', handleTodoCreated);
      socket.off('todo:updated', handleTodoUpdated);
      socket.off('todo:completed', handleTodoCompleted);
      socket.off('todo:deleted', handleTodoDeleted);
    };
  }, [socket, currentUserId]);

  // 3. User Actions
  const handleOpenCreateModal = (context = null) => {
    if (isPlanDisabled) return;
    setEditingTodo(null);
    setModalContext(context || contextData || null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (todo) => {
    setEditingTodo(todo);
    setModalContext(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
    setModalContext(null);
    onCloseCreateModalExternal?.();
  };

  const handleSubmitModal = async (payload, todoId) => {
    if (todoId) {
      // Update
      const res = await updateTodo(todoId, payload);
      if (res.success && res.todo) {
        setTodos((prev) =>
          prev.map((t) =>
            (t._id || t.id).toString() === todoId.toString() ? res.todo : t
          )
        );
      }
    } else {
      // Create
      await createTodo(payload);
    }
  };

  const handleToggleStatus = async (todoId) => {
    try {
      // Optimistic UI update
      setTodos((prev) =>
        prev.map((t) => {
          if ((t._id || t.id).toString() === todoId.toString()) {
            const isNowCompleted = t.status !== 'completed';
            return {
              ...t,
              status: isNowCompleted ? 'completed' : 'pending',
              completedAt: isNowCompleted ? new Date().toISOString() : null,
            };
          }
          return t;
        })
      );

      const res = await toggleTodoStatus(todoId);
      if (res.success && res.todo) {
        setTodos((prev) =>
          prev.map((t) =>
            (t._id || t.id).toString() === todoId.toString() ? res.todo : t
          )
        );
      }
    } catch (err) {
      console.error('Toggle status error:', err.message);
      fetchTodos(); // Revert on failure
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      // Optimistic UI update
      setTodos((prev) =>
        prev.filter((t) => (t._id || t.id).toString() !== todoId.toString())
      );
      await deleteTodo(todoId);
    } catch (err) {
      console.error('Delete todo error:', err.message);
      fetchTodos(); // Revert on failure
    }
  };

  return (
    <div className="todo-page-wrapper">
      {/* 1. Main To-Dos Header Bar */}
      <header className="todo-page-header">
        <div className="todo-header-left">
          <div className="todo-icon-box">
            <TodoIcon size={22} color="#0284c7" />
          </div>
          <div>
            <h2 className="todo-page-title">To-Dos</h2>
            <p className="todo-page-subtitle">
              Manage deliverables, track assignments, and collaborate in real time.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-add-todo-primary"
          onClick={isPlanDisabled ? undefined : () => handleOpenCreateModal()}
          disabled={isPlanDisabled}
          title={
            isPlanDisabled
              ? (isExpired ? 'Your subscription plan has expired.' : 'Your subscription has been Ended')
              : 'Add a To-Do'
          }
        >
          <span className="btn-icon">+</span>
          <span>Add a To-Do</span>
        </button>
      </header>

      {/* 2. Search Bar */}
      <div className="todo-search-row">
        <div className="todo-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="todo-search-input"
            placeholder="Search to-dos by title, description, teammate, channel..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Filters & View Tabs */}
      <TodoFilters
        activeView={activeView}
        onViewChange={setActiveView}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        allCount={allCount}
        myCount={myCount}
      />

      {/* Global Error Banner (suppressed when plan is disabled so banner shows ONLY ONCE at the TOP of the page) */}
      {error && !isPlanDisabled && (
        <div className="todo-error-banner">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* 4. Grouped Tasks List */}
      <main className="todo-page-main">
        {(() => {
          const visibleTodos = todos.filter((t) => {
            const creatorId = (t.createdBy?._id || t.createdBy)?.toString();
            const assigneeId = (t.assignedTo?._id || t.assignedTo)?.toString();
            const isPersonal = Boolean(creatorId && assigneeId && creatorId === assigneeId);
            return !isPersonal || creatorId === currentUserId;
          });

          return (
            <TodoList
              todos={visibleTodos}
              loading={loading}
              searchQuery={searchQuery}
              activeView={activeView}
              currentUserId={currentUserId}
              userRole={user?.role}
              onToggleStatus={handleToggleStatus}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteTodo}
              onNavigateToConversation={onNavigateToConversation}
              onNavigateToChannel={onNavigateToChannel}
              onNavigateToMessage={onNavigateToMessage}
              onOpenCreateModal={() => handleOpenCreateModal()}
              onAddToCalendar={onAddToCalendar}
            />
          );
        })()}
      </main>

      {/* 5. Create / Edit Modal */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        initialData={editingTodo}
        contextData={modalContext}
        availableUsers={availableUsers}
        currentUserId={currentUserId}
      />
    </div>
  );
}

export default TodoPage;
