import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

const ExampleComponent = ({ name }: { name: string }) => {
  return <h1>Hello, {name}</h1>;
};

test('renders hello message', () => {
  render(<ExampleComponent name="10xDevs" />);
  expect(screen.getByText('Hello, 10xDevs')).toBeInTheDocument();
});
