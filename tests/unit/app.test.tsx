import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import App from '../../src/App';

it('mostra o nome do app', async () => {
  render(<App />);
  expect(await screen.findByText('Trama')).toBeInTheDocument();
});

it('não tem violações de acessibilidade na tela inicial', async () => {
  const { container } = render(<App />);
  await screen.findByText('Trama');
  expect(await axe(container)).toHaveNoViolations();
});
