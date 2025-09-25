import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('AddListingForm', () => {
  it('is disabled initially without required fields', async () => {
    const { AddListingForm } = require('../forms')
    const user = userEvent.setup()

    const onSubmit = jest.fn()
    render(<AddListingForm marketId="m1" marketName="Market" marketLocation="Berlin,Mitte" onSuccess={onSubmit} />)

    const submit = screen.getByRole('button', { name: /create listing/i })
    expect(submit).toBeDisabled()
  })

  // Happy path submit test deferred until form validations are finalized
})


