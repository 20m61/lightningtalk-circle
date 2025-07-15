import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../components/Input/Input';

describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input label="Email Address" />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<Input label="Required Field" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container, rerender } = render(<Input size="sm" />);
    let input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--sm/);

    rerender(<Input size="md" />);
    input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--md/);

    rerender(<Input size="lg" />);
    input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--lg/);
  });

  it('applies variant classes correctly', () => {
    const { container, rerender } = render(<Input variant="default" />);
    let input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--default/);

    rerender(<Input variant="outlined" />);
    input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--outlined/);

    rerender(<Input variant="filled" />);
    input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--filled/);
  });

  it('shows error state', () => {
    const { container } = render(<Input error="This field is required" />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--error/);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows helper text', () => {
    render(<Input helperText="Enter a valid email address" />);
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('handles controlled input', () => {
    const handleChange = vi.fn();
    render(<Input value="test" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test');

    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles uncontrolled input', () => {
    render(<Input defaultValue="initial" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');

    fireEvent.change(input, { target: { value: 'changed' } });
    expect(input).toHaveValue('changed');
  });

  it('shows character count when enabled', () => {
    render(<Input showCharCount maxLength={100} defaultValue="hello" />);
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('renders with start icon', () => {
    const { container } = render(<Input startIcon={<span data-testid="start-icon">🔍</span>} />);
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();

    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--has-start-icon/);
  });

  it('renders with end icon', () => {
    const { container } = render(<Input endIcon={<span data-testid="end-icon">✉️</span>} />);
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();

    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--has-end-icon/);
  });

  it('shows loading state', () => {
    const { container } = render(<Input loading />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toMatch(/input--has-end-icon/);
    // Loading spinner SVG should be present
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input).toHaveClass('custom-input');
  });

  it('applies container className', () => {
    const { container } = render(<Input containerClassName="custom-container" />);
    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('custom-container');
  });
});
