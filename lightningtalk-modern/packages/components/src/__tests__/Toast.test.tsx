import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, ToastContainer, useToast } from '../components/Toast/Toast';
import { renderHook, act } from '@testing-library/react';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders with message', () => {
    render(<Toast id="test" message="Test message" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders with different types', () => {
    const { container, rerender } = render(<Toast id="test" message="Success" type="success" />);
    expect(container.firstChild).toHaveClass('success');

    rerender(<Toast id="test" message="Error" type="error" />);
    expect(container.firstChild).toHaveClass('error');

    rerender(<Toast id="test" message="Warning" type="warning" />);
    expect(container.firstChild).toHaveClass('warning');

    rerender(<Toast id="test" message="Info" type="info" />);
    expect(container.firstChild).toHaveClass('info');
  });

  it('shows close button when closable', () => {
    render(<Toast id="test" message="Test" closable />);
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });

  it('hides close button when not closable', () => {
    render(<Toast id="test" message="Test" closable={false} />);
    expect(screen.queryByRole('button', { name: '閉じる' })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast id="test" message="Test" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    // Wait for the animation delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledWith('test');
  });

  it('auto-dismisses after duration', () => {
    const onClose = vi.fn();
    render(<Toast id="test" message="Test" duration={1000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for the animation delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledWith('test');
  });

  it('does not auto-dismiss when duration is 0', () => {
    const onClose = vi.fn();
    render(<Toast id="test" message="Test" duration={0} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders with action button', () => {
    const action = { label: 'Retry', onClick: vi.fn() };
    render(<Toast id="test" message="Test" action={action} />);

    const actionButton = screen.getByRole('button', { name: 'Retry' });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(action.onClick).toHaveBeenCalled();
  });

  it('renders with custom icon', () => {
    render(<Toast id="test" message="Test" icon={<span data-testid="custom-icon">🎉</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Toast id="test" message="Test" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });
});

describe('ToastContainer Component', () => {
  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1' },
      { id: '2', message: 'Toast 2' },
      { id: '3', message: 'Toast 3' }
    ];

    render(<ToastContainer toasts={toasts} onRemove={() => {}} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('applies position classes', () => {
    const { container, rerender } = render(
      <ToastContainer toasts={[]} onRemove={() => {}} position="top-right" />
    );
    expect(container.firstChild).toHaveClass('top-right');

    rerender(<ToastContainer toasts={[]} onRemove={() => {}} position="bottom-left" />);
    expect(container.firstChild).toHaveClass('bottom-left');
  });

  it('calls onRemove when toast is closed', () => {
    const onRemove = vi.fn();
    const toasts = [{ id: '1', message: 'Test' }];

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onRemove).toHaveBeenCalledWith('1');
  });
});

describe('useToast Hook', () => {
  it('adds and removes toasts', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toHaveLength(0);

    act(() => {
      result.current.showToast({
        message: 'Test toast',
        type: 'success'
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test toast');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();

    act(() => {
      result.current.removeToast(result.current.toasts[0].id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('clears all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ message: 'Toast 1' });
      result.current.showToast({ message: 'Toast 2' });
      result.current.showToast({ message: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('generates unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ message: 'Toast 1' });
      result.current.showToast({ message: 'Toast 2' });
    });

    const [toast1, toast2] = result.current.toasts;
    expect(toast1.id).not.toBe(toast2.id);
    expect(toast1.id).toMatch(/^toast-\d+-/);
    expect(toast2.id).toMatch(/^toast-\d+-/);
  });
});
