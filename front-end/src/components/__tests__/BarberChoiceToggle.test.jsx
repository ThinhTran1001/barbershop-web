import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarberChoiceToggle from '../BarberChoiceToggle';

describe('BarberChoiceToggle', () => {
  const mockOnChoiceChange = jest.fn();

  beforeEach(() => {
    mockOnChoiceChange.mockClear();
  });

  test('renders with auto-assignment mode by default', () => {
    render(
      <BarberChoiceToggle
        chooseBarberManually={false}
        onChoiceChange={mockOnChoiceChange}
      />
    );

    expect(screen.getByText('Choose Barber')).toBeInTheDocument();
    expect(screen.getByText('Auto-Assignment Mode')).toBeInTheDocument();
    expect(screen.getByText(/We'll automatically assign the best available barber/)).toBeInTheDocument();
  });

  test('renders with manual selection mode', () => {
    render(
      <BarberChoiceToggle
        chooseBarberManually={true}
        onChoiceChange={mockOnChoiceChange}
      />
    );

    expect(screen.getByText('Manual Barber Selection')).toBeInTheDocument();
    expect(screen.getByText(/You will choose a specific barber/)).toBeInTheDocument();
  });

  test('calls onChoiceChange when checkbox is clicked', () => {
    render(
      <BarberChoiceToggle
        chooseBarberManually={false}
        onChoiceChange={mockOnChoiceChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChoiceChange).toHaveBeenCalledWith(true);
  });

  test('checkbox is disabled when disabled prop is true', () => {
    render(
      <BarberChoiceToggle
        chooseBarberManually={false}
        onChoiceChange={mockOnChoiceChange}
        disabled={true}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('applies correct CSS classes based on mode', () => {
    const { rerender } = render(
      <BarberChoiceToggle
        chooseBarberManually={false}
        onChoiceChange={mockOnChoiceChange}
      />
    );

    expect(document.querySelector('.auto-mode')).toBeInTheDocument();

    rerender(
      <BarberChoiceToggle
        chooseBarberManually={true}
        onChoiceChange={mockOnChoiceChange}
      />
    );

    expect(document.querySelector('.manual-mode')).toBeInTheDocument();
  });
});
