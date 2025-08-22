# Firestore Rules Testing for Galaxy Maps

This directory contains comprehensive tests for the Firestore security rules, including specific tests for the new map-nodes and map-edges subcollections.

## Test Files

- **`test-rules.js`** - Comprehensive test suite for all Firestore rules including map nodes and edges
- **`test-data.json`** - Test data including sample courses, users, and map structures

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js** dependencies installed:
   ```bash
   npm install
   ```

3. **Firebase emulators** running:
   ```bash
   firebase emulators:start
   ```

## Running Tests

### Run All Tests (Comprehensive)

Test all Firestore rules including map nodes and edges:

```bash
firebase emulators:exec --only firestore,auth "node test-rules.js"
```

### Run with Data Import First

If you want to import test data separately:

```bash
# First import test data
firebase emulators:exec --only firestore,auth "node test-rules.js"

# Then run tests
firebase emulators:exec --only firestore,auth "node test-rules.js"
```

## Test Coverage

### Map Nodes and Edges Rules Testing

The tests verify the following access patterns for `map-nodes` and `map-edges` subcollections:

#### Unauthenticated Users
- ✅ Can read from public courses
- ❌ Cannot read from private courses
- ❌ Cannot write to any courses

#### Students
- ✅ Can read from assigned courses
- ✅ Can read from public courses
- ❌ Cannot read from unassigned private courses
- ❌ Cannot write to any courses

#### Teachers
- ✅ Can read from own courses
- ✅ Can read from other teachers' public courses
- ❌ Cannot read from other teachers' private courses
- ✅ Can create/update/delete in own courses
- ❌ Cannot modify other teachers' courses

#### Admins
- ✅ Can read from all courses
- ✅ Can create/update/delete in any course
- ✅ Full access to all map structures

## Test Data Structure

The test data includes:

- **4 courses** with different access levels (public/private)
- **Map nodes** for each course with various types (start, content, exercise)
- **Map edges** connecting nodes with progression paths
- **Users** with different roles (student, teacher, admin)
- **Cohorts** and course assignments

## Expected Test Results

When all tests pass, you should see:

```
🎉 All tests passed! Your Firestore rules are working correctly.
```

## Troubleshooting

### Common Issues

1. **Emulators not running**: Make sure both Firestore and Auth emulators are started
2. **Port conflicts**: Ensure ports 8080 (Firestore) and 9099 (Auth) are available
3. **Authentication errors**: Check that test users are properly created in the emulator

### Debug Mode

To see more detailed output, you can modify the test files to add console.log statements or run with Node.js debug flags.

## Security Rules Being Tested

The tests verify these Firestore rules:

```javascript
// Map nodes subcollection under courses
match /courses/{courseId}/map-nodes/{nodeId} {
  allow read: if coursePublicAccess(courseId) || canEditCourse(courseId) || isAdmin();
  allow write: if canEditCourse(courseId) || isAdmin();
}

// Map edges subcollection under courses  
match /courses/{courseId}/map-edges/{edgeId} {
  allow read: if coursePublicAccess(courseId) || canEditCourse(courseId) || isAdmin();
  allow write: if canEditCourse(courseId) || isAdmin();
}
```

## Contributing

When adding new test cases:

1. Add test data to `test-data.json`
2. Add corresponding tests to the appropriate test function
3. Ensure tests cover both positive and negative cases
4. Update this README if adding new test categories
