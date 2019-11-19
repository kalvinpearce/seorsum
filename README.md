# Seorsum

## Why

I have problems with redux and react-redux when working with react.
I want to my view and business logic to be as separate as possible.
I feel like you should be able to have all your state management and business
logic in separate files to your view.

With redux this seems to be a had task to tackle especially with react-redux.
So I created a state management system to function outside the view but with
easy access from inside the view, while still being able to rerender components
that subscribe to that piece of state.

## Usage

```tsx
// Import the createStore function
import { createStore } from 'seorsum';

// Create an initial state
const initialState = {
  name: {
    first: 'John',
    last: 'Doe',
  },
  age: 50,
};

// Create the store object
const { updateState, subscribe, useStateValue } = createStore(initialState);

// Create an action
const setAge = (age: number) => {
  return updateState(draft => {
    draft.age = age;
  });
};

/* React Usage */
import * as React from 'react';
const AgeComponent = () => {
  const age = useStateValue('age');
  const firstName = useStateValue(['name', 'first']);
  return (
    <span>
      {firstName} is {age} years old.
    </span>
  );
};
// This component is now subscribed to the state and when the age is changed
// the component will rerender

// Calling the setAge action we created earlier will update the state
// and rerender any component that uses it
setAge(60);
// or
const AgeButtonComponent = () => (
  <button onClick={() => setAge(60)}>Set Age!</button>
);

/* Non-react usage */
// Just subscribe to a state with a callback to run
const unsubscribe = subscribe('age', age => {
  console.log(`Age changed! New value is ${age}`);
});
// This callback will be run every time age is changed until `unsubscribe` is run
setAge(60); // console.log: "Age changed! New value is 60"
unsubscribe();
setAge(10); // no logs
```

## Benefits

Because it's so decoupled from the view you can test your state updates very
easily without having to render any components. It also means you can test your
view separately as well.

```ts
// Create an action
const setAge = (age: number) => {
  return updateState(draft => {
    draft.age = age;
  });
};

const newState = setAge(10);
expect(newState.age).toBe(10);
```

Asynchronous actions are possible by default so no more need for Thunk or Saga

```ts
const fetchResults = async () => {
  const results = await api.fetch();
  return updateState(draft => {
    draft.results = results;
  });
};
```
