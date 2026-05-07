import { NoteList } from '@/components/NoteList';
import { db } from '@/db/schema';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(async () => {
  await db.notes.clear();
});

describe('<NoteList />', () => {
  it('shows an empty-state message when no notes exist', async () => {
    render(<NoteList />);
    expect(await screen.findByText(/noch keine notizen/i)).toBeInTheDocument();
  });

  it('renders existing notes after they are added', async () => {
    await db.notes.add({ title: 'A', body: 'a-body', createdAt: 1, updatedAt: 1 });
    await db.notes.add({ title: 'B', body: 'b-body', createdAt: 2, updatedAt: 2 });

    render(<NoteList />);
    expect(await screen.findByText('A')).toBeInTheDocument();
    expect(await screen.findByText('B')).toBeInTheDocument();
  });

  it('removes a note when its delete button is clicked', async () => {
    const user = userEvent.setup();
    await db.notes.add({ title: 'weg', body: '', createdAt: 1, updatedAt: 1 });
    render(<NoteList />);

    const button = await screen.findByRole('button', { name: /löschen weg/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByText('weg')).not.toBeInTheDocument();
    });
  });
});
