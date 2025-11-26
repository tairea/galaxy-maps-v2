# Testing guide

User actions we want to test:

### Manual Galaxy

- [] can create a manual galaxy
  - [ ] can enter title
  - [ ] can enter description
  - [ ] can upload an image
  - [ ] can create
  - [ ] it loads correctly
  - [ ] can add a new node called “A”
  - [ ] can add a new node called “B” that has a different (larger) size, and has prerequisite “A”
  - [ ] can add a new node called "C" that has an image, and a prerequisite of "A"
  - [ ] can add a new node called "D" that has a prerequisite of "C"
  - [ ] can edit node "D" and rename to "D fork"
  - [ ] can add a new node called "E" that has a prerequisite of "D"
  - [ ] can add a new node called "F" that has a prerequisite of "D"
  - [ ] can add a new node called "G" that has a prerequisite of "D"
  - [ ] can add a new node called "Final Boss" that has a prerequisite of "E", "F" & "G"
  - [ ] can add a new node called "Done" that has a prerequisite of "Final Boss"
  - [ ] can add a new node called “H”
  - [ ] can delete node “H”
  - [ ] can add a new node called "random connected"
  - [ ] can click edit nodes/edges, can draw a new connection between node "A" and node "random connected"
  - [ ] can add a new node called "random disconnected"
  - [ ] can click edit nodes/edges, can draw a new connection between node "A" and node "random disconnected"
  - [ ] can click on edge between "random disconnected" and "A" and delete it
  - [ ] can delete node "F"
    - [ ] this should successfully remove "F" prequisite off of "Final Boss"
