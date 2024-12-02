// suggested firebase rules from claude-3.5-sonnet

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }

    // People collection
    match /people/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isOwner(userId);
      
      // Allow access to subcollections for course progress
      match /{courseId}/{document=**} {
        allow read: if isAuthenticated() && (
          isAdmin() || 
          isOwner(userId) ||
          exists(/databases/$(database)/documents/courses/$(courseId)/teachers/$(request.auth.uid))
        );
        allow write: if isAuthenticated() && (
          isAdmin() || 
          isOwner(userId)
        );
      }
    }

    // Courses collection
    match /courses/{courseId} {
      allow read: if isAuthenticated() || (
        resource.data.public == true && 
        resource.data.status == 'published'
      );
      allow write: if isAdmin() || 
        (isAuthenticated() && resource.data.owner == '/people/' + request.auth.uid);
      
      // Course content subcollections
      match /{subcollection=**}/{document} {
        allow read: if isAuthenticated() || (
          get(/databases/$(database)/documents/courses/$(courseId)).data.public == true &&
          get(/databases/$(database)/documents/courses/$(courseId)).data.status == 'published'
        );
        allow write: if isAdmin() || 
          (isAuthenticated() && get(/databases/$(database)/documents/courses/$(courseId)).data.owner == '/people/' + request.auth.uid);
      }
    }

    // Status collection (for presence system)
    match /status/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Organizations collection
    match /organisations/{orgId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Cohorts collection 
    match /cohorts/{cohortId} {
      allow read: if isAuthenticated() && (
        isAdmin() ||
        request.auth.uid in resource.data.teachers ||
        request.auth.uid in resource.data.students
      );
      allow write: if isAdmin() || 
        (isAuthenticated() && request.auth.uid in resource.data.teachers);
    }
  }
}