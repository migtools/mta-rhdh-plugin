import { render, screen } from '@testing-library/react';
import { configApiRef } from '@backstage/core-plugin-api';
import { mockApis, TestApiProvider } from '@backstage/frontend-test-utils';
import { themes, UnifiedThemeProvider } from '@backstage/theme';
import { PhaseFailed, type PhaseFailedProps } from './PhaseFailed';
import type { KonveyorTask } from '../../api/types';

const task: KonveyorTask = {
  id: 7,
  name: 'application-1-analyzer',
  addon: 'analyzer',
  state: 'Failed',
  application: { id: 1, name: 'Live application' },
};

function renderFailed(
  support?: { name?: string; email?: string },
  props: Partial<PhaseFailedProps> = {},
) {
  return render(
    <TestApiProvider
      apis={[[configApiRef, mockApis.config({ data: { mta: { support } } })]]}
    >
      <UnifiedThemeProvider theme={themes.light}>
        <PhaseFailed task={task} onRetry={jest.fn()} {...props} />
      </UnifiedThemeProvider>
    </TestApiProvider>,
  );
}

describe('failed task screen', () => {
  it('titles a failed task as failed', () => {
    renderFailed();
    expect(screen.getByText('Hub task failed')).toBeInTheDocument();
  });

  it('titles a canceled task as canceled', () => {
    renderFailed(undefined, { task: { ...task, state: 'Canceled' } });
    expect(screen.getByText('Hub task canceled')).toBeInTheDocument();
    expect(screen.queryByText('Hub task failed')).not.toBeInTheDocument();
  });

  it('renders the profile action on its own when retry is unavailable', () => {
    renderFailed(undefined, { canRetry: false, onSelectProfile: jest.fn() });
    expect(
      screen.getByRole('button', { name: 'Select analysis profile' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retry task' }),
    ).not.toBeInTheDocument();
  });

  it('renders no actions container when no action is available', () => {
    const { container } = renderFailed(undefined, { canRetry: false });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('.actions')).toBeNull();
  });
});

describe('failed task support contact', () => {
  it('links the name to the address when both are configured', () => {
    renderFailed({
      name: 'Migration Team',
      email: 'migration-team@example.test',
    });
    const link = screen.getByRole('link', { name: 'Migration Team' });
    expect(link).toHaveAttribute('href', 'mailto:migration-team@example.test');
    expect(screen.getByText(/If the problem continues/)).toHaveTextContent(
      'If the problem continues, contact Migration Team.',
    );
  });

  it('names the contact without a link when only a name is configured', () => {
    renderFailed({ name: 'Migration Team' });
    expect(
      screen.getByText('If the problem continues, contact Migration Team.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links the address when only an email is configured', () => {
    renderFailed({ email: 'migration-team@example.test' });
    expect(
      screen.getByRole('link', { name: 'migration-team@example.test' }),
    ).toHaveAttribute('href', 'mailto:migration-team@example.test');
    expect(screen.getByText(/If the problem continues/)).toHaveTextContent(
      'If the problem continues, contact migration-team@example.test.',
    );
  });

  it('renders no contact sentence without configuration', () => {
    renderFailed();
    expect(
      screen.queryByText(/If the problem continues/),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('treats an invalid email as not configured', () => {
    renderFailed({ name: 'Migration Team', email: 'not-an-email' });
    expect(
      screen.getByText('If the problem continues, contact Migration Team.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
