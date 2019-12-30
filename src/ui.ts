import { $$ } from './utils';

const buttons = $$('.button-list > button');

Array.from(buttons).forEach(button => {
    button.addEventListener('click', () => console.log('in'))
});