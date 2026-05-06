import { NoteForm } from '@/components/NoteForm';
import { db } from '@/db/schema';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(async () => {
  await db.notes.clear();
});

describe('<NoteForm />', () => {
  it('persists a note when submitted and clears the inputs', async () => {
    const user = userEvent.setup();
    render(<NoteForm />);

    await user.type(screen.getByLabelText(/titel/i), 'Einkaufen');
    await user.type(screen.getByLabelText(/inhalt/i), 'Brot, Milch');
    await user.click(screen.getByRole('button', { name: /hinzufügen/i }));

    const stored = await db.notes.toArray();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ title: 'Einkaufen', body: 'Brot, Milch' });

    expect((screen.getByLabelText(/titel/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/inhalt/i) as HTMLTextAreaElement).value).toBe('');
  });

  it('does not submit when the title is empty', async () => {
    const user = userEvent.setup();
    render(<NoteForm />);
    await user.click(screen.getByRole('button', { name: /hinzufügen/i }));
    const stored = await db.notes.toArray();
    expect(stored).toHaveLength(0);
  });
});
