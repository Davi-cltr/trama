import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import App from '../../src/App';

it('mostra o nome do app', () => {
  render(<App />);
  expect(screen.getByText('Trama')).toBeInTheDocument();
});

it('não tem violações de acessibilidade na tela inicial', async () => {
  const { container } = render(<App />);
  expect(await axe(container)).toHaveNoViolations();
});
