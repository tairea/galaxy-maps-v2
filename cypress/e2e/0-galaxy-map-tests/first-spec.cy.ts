/// <reference types="Cypress" />

describe('My First Test', () => {

  it('Visits GM', () => {
    cy.login()
    cy.visit('http://localhost:8080/base/galaxies')
  })
})