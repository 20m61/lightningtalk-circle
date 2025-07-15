import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/Card/Card';

describe('Card Component', () => {
  it('renders with default props', () => {
    render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders without header when title is not provided', () => {
    render(
      <Card>
        <p>Card content only</p>
      </Card>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Card content only')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(
      <Card variant="highlighted" title="Highlighted Card">
        Content
      </Card>
    );

    const card = container.firstChild as HTMLElement;
    // CSS Modules generates hashed class names, check if any class contains the variant
    expect(card.className).toMatch(/card--highlighted/);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <Card className="custom-card" title="Custom Card">
        Content
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-card');
  });

  it('renders footer when provided', () => {
    render(
      <Card title="Card with Footer" footer={<button>Action</button>}>
        Content
      </Card>
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders with image', () => {
    render(
      <Card title="Card with Image" image="/test-image.jpg" imageAlt="Test image">
        Content
      </Card>
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('handles click events when clickable', () => {
    const handleClick = vi.fn();
    render(
      <Card title="Clickable Card" onClick={handleClick} clickable>
        Content
      </Card>
    );

    const card = screen.getByRole('button');
    card.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies elevation styles', () => {
    const { container } = render(
      <Card elevation={2} title="Elevated Card">
        Content
      </Card>
    );

    const card = container.firstChild as HTMLElement;
    // CSS Modules generates hashed class names, check if any class contains the elevation
    expect(card.className).toMatch(/card--elevation-2/);
  });
});
