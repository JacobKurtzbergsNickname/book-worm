import { test, expect } from '@playwright/test';

test('covers list, create, read, update and delete book flows', async ({ page }) => {
  const books = [
    {
      id: 1,
      title: 'Existing Book',
      isbn: '123',
      price: 10,
      description: 'Seed book',
      publishedDate: '2024-01-01T00:00:00',
      author: { firstName: 'Seed', lastName: 'Author' },
      genres: ['Fiction'],
    },
  ];

  await page.route('**/api/books*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const parts = url.pathname.split('/').filter(Boolean);
    const id = Number(parts[parts.length - 1]);

    if (request.method() === 'GET' && url.pathname === '/api/books/') {
      await route.fulfill({ json: books });
      return;
    }

    if (request.method() === 'POST' && url.pathname === '/api/books/') {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const created = {
        id: books.length + 1,
        title: payload.title,
        isbn: payload.isbn ?? '',
        price: payload.price,
        description: payload.description ?? '',
        publishedDate: payload.publishedDate ?? '2024-01-01T00:00:00',
        author: payload.author ?? null,
        genres: payload.genre ?? [],
      };
      books.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    if (request.method() === 'GET' && url.pathname.startsWith('/api/books/')) {
      const found = books.find((b) => b.id === id);
      await route.fulfill(found ? { json: found } : { status: 404 });
      return;
    }

    if (request.method() === 'PUT' && url.pathname.startsWith('/api/books/')) {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const index = books.findIndex((b) => b.id === id);
      if (index === -1) {
        await route.fulfill({ status: 404 });
        return;
      }
      books[index] = {
        ...books[index],
        title: payload.title,
        isbn: payload.isbn ?? '',
        price: payload.price,
        description: payload.description ?? '',
        publishedDate: payload.publishedDate ?? books[index].publishedDate,
        author: payload.author ?? null,
        genres: payload.genre ?? [],
      };
      await route.fulfill({ json: books[index] });
      return;
    }

    if (request.method() === 'DELETE' && url.pathname.startsWith('/api/books/')) {
      const index = books.findIndex((b) => b.id === id);
      if (index === -1) {
        await route.fulfill({ status: 404 });
        return;
      }
      const deleted = books.splice(index, 1)[0];
      await route.fulfill({ json: deleted });
      return;
    }

    await route.fallback();
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'All Books' })).toBeVisible();
  await expect(page.getByText('Existing Book')).toBeVisible();

  await page.getByLabel('Title').fill('New Book');
  await page.getByLabel('ISBN').fill('999-1');
  await page.getByLabel('Price').fill('29.99');
  await page.getByLabel('Description').fill('Created in test');
  await page.getByLabel('Author First Name').fill('Nina');
  await page.getByLabel('Author Last Name').fill('Writer');
  await page.getByLabel('Genres').fill('Drama, Test');
  await page.getByRole('button', { name: 'Create Book' }).click();

  await expect(page.getByText('New Book')).toBeVisible();

  await page.getByRole('link', { name: 'View' }).last().click();
  await expect(page.getByRole('heading', { name: /Book: New Book/ })).toBeVisible();

  await page.getByLabel('Title').fill('Updated Book');
  await page.getByLabel('Price').fill('31.50');
  await page.getByRole('button', { name: 'Update Book' }).click();

  await expect(page.getByRole('heading', { name: /Book: Updated Book/ })).toBeVisible();

  await page.getByRole('button', { name: 'Delete Book' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Updated Book')).not.toBeVisible();
});
