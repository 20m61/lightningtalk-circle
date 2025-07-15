import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/Button/Button';

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant styles', () => {
    const { container } = render(<Button variant="primary">Primary Button</Button>);
    const button = container.firstChild as HTMLElement;
    // CSS Modules generates hashed class names, check if any class contains the variant
    expect(button.className).toMatch(/button--primary/);
  });

  it('applies secondary variant styles', () => {
    const { container } = render(<Button variant="secondary">Secondary Button</Button>);
    const button = container.firstChild as HTMLElement;
    // CSS Modules generates hashed class names, check if any class contains the variant
    expect(button.className).toMatch(/button--secondary/);
  });

  it('applies size classes correctly', () => {
    const { container, rerender } = render(<Button size="sm">Small</Button>);
    let button = container.firstChild as HTMLElement;
    expect(button.className).toMatch(/button--sm/);

    rerender(<Button size="md">Medium</Button>);
    button = container.firstChild as HTMLElement;
    expect(button.className).toMatch(/button--md/);

    rerender(<Button size="lg">Large</Button>);
    button = container.firstChild as HTMLElement;
    expect(button.className).toMatch(/button--lg/);
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { container } = render(<Button loading>Loading...</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toMatch(/button--loading/);
    expect(button).toBeDisabled();
  });

  it('renders as a link when href is provided', () => {
    render(<Button href="https://example.com">Link Button</Button>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref).toHaveBeenCalled();
  });
});
