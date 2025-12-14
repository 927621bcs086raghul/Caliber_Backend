# Caliber Backend Architecture

## 🏗️ Layered Architecture Pattern

This backend follows a **Controller-Service-Repository** architecture pattern, providing clear separation of concerns and improved maintainability.

## 📁 Project Structure

```
Caliber_Backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/              # 🎮 Controller Layer (NEW)
│   ├── authController.js     # Handles HTTP requests/responses for auth
│   └── videoController.js    # Handles HTTP requests/responses for videos
├── services/                 # 💼 Service Layer (NEW)
│   ├── authService.js        # Business logic for authentication
│   └── videoService.js       # Business logic for video operations
├── repositories/             # 🗄️ Repository Layer (NEW)
│   ├── userRepository.js     # Database operations for User entity
│   └── videoRepository.js    # Database operations for Video entity
├── models/
│   ├── user.js               # User Sequelize model
│   └── video.js              # Video Sequelize model
├── routes/
│   ├── auth.js               # Auth route definitions (uses controllers)
│   └── video.js              # Video route definitions (uses controllers)
├── middleware/
│   └── authMiddleware.js     # JWT authentication middleware
├── uploads/                  # Uploaded video files
└── server.js                 # Express server setup
```

## 🔄 Architecture Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   Routes    │ (Route definitions)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │ (Handle HTTP, validate input)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │ (Business logic)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Repositories │ (Database operations)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │ (PostgreSQL/MySQL via Sequelize)
└─────────────┘
```

## 📊 Layer Responsibilities

### 1️⃣ Controllers (`/controllers`)
**Responsibility**: Handle HTTP requests and responses

- Receive HTTP requests from routes
- Validate request data
- Call appropriate service methods
- Format and send HTTP responses
- Handle errors and status codes

**Example**:
```javascript
// authController.js
async login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.cookie('token', result.token).json({ user: result.user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}
```

### 2️⃣ Services (`/services`)
**Responsibility**: Implement business logic

- Contain business rules and validation
- Coordinate between multiple repositories if needed
- Handle complex operations
- Throw errors with appropriate messages
- Independent of HTTP layer

**Example**:
```javascript
// authService.js
async login(credentials) {
  const user = await userRepository.findByEmail(credentials.email);
  if (!user) throw new Error('Invalid credentials');
  
  const isMatch = await user.matchPassword(credentials.password);
  if (!isMatch) throw new Error('Invalid credentials');
  
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  return { token, user };
}
```

### 3️⃣ Repositories (`/repositories`)
**Responsibility**: Database operations

- Perform CRUD operations
- Query the database using Sequelize ORM
- Return raw data or model instances
- No business logic
- Reusable across services

**Example**:
```javascript
// userRepository.js
async findByEmail(email) {
  return await User.findOne({ where: { email } });
}

async create(userData) {
  return await User.create(userData);
}
```

## ✅ Benefits of This Architecture

### 1. **Separation of Concerns**
Each layer has a single, well-defined responsibility:
- Controllers: HTTP handling
- Services: Business logic
- Repositories: Data access

### 2. **Testability**
Easy to write unit tests for each layer independently:
```javascript
// Test service without HTTP
const result = await authService.login({ email, password });

// Test repository without business logic
const user = await userRepository.findByEmail(email);
```

### 3. **Reusability**
Services and repositories can be reused across different controllers or routes:
```javascript
// Reuse in different contexts
const user = await userRepository.findById(userId);
```

### 4. **Maintainability**
Changes in one layer don't affect others:
- Change database? Update repositories only
- Change business logic? Update services only
- Change API format? Update controllers only

### 5. **Scalability**
Easy to add new features following the same pattern:
```
New Feature → New Controller → New Service → New Repository
```

## 🔐 Authentication Flow Example

```javascript
// 1. Route receives request
POST /api/auth/login

// 2. Controller validates and delegates
authController.login(req, res)
  ↓
// 3. Service implements business logic
authService.login({ email, password })
  ↓
// 4. Repository queries database
userRepository.findByEmail(email)
  ↓
// 5. Returns through layers
user → service → controller → response
```

## 🎥 Video Upload Flow Example

```javascript
// 1. Route with middleware
POST /api/videos (protect, upload.fields())

// 2. Controller handles file upload
videoController.uploadVideo(req, res, io)
  ↓
// 3. Service validates and processes
videoService.uploadVideo({ files, title, description, userId })
  ↓
// 4. Repository saves to database
videoRepository.create(videoData)
  ↓
// 5. Socket.IO emits real-time event
io.to('dashboard').emit('videoUploaded', video)
```

## 🆕 Adding New Features

To add a new feature, follow this pattern:

### 1. Create Repository
```javascript
// repositories/commentRepository.js
class CommentRepository {
  async create(commentData) { /* ... */ }
  async findByVideoId(videoId) { /* ... */ }
}
```

### 2. Create Service
```javascript
// services/commentService.js
class CommentService {
  async addComment(videoId, userId, text) {
    // Business logic here
    return await commentRepository.create({ videoId, userId, text });
  }
}
```

### 3. Create Controller
```javascript
// controllers/commentController.js
class CommentController {
  async addComment(req, res) {
    const comment = await commentService.addComment(/* ... */);
    res.json(comment);
  }
}
```

### 4. Add Routes
```javascript
// routes/comment.js
router.post('/:videoId/comments', protect, 
  (req, res) => commentController.addComment(req, res)
);
```

## 🧪 Testing Strategy

### Unit Tests
- **Repositories**: Test database queries with mock DB
- **Services**: Test business logic with mock repositories
- **Controllers**: Test HTTP handling with mock services

### Integration Tests
- Test complete flow from route to database
- Use test database

### Example Test
```javascript
// Test service with mocked repository
describe('AuthService', () => {
  it('should login user with valid credentials', async () => {
    // Mock repository
    userRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
    
    // Test service
    const result = await authService.login({ email, password });
    
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe(email);
  });
});
```

## 🔄 Migration from Old Architecture

### Before (Old Structure)
```javascript
// routes/auth.js
router.post('/login', async (req, res) => {
  // Everything mixed together:
  // - HTTP handling
  // - Business logic
  // - Database queries
  const user = await User.findOne({ where: { email } });
  const isMatch = await user.matchPassword(password);
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.cookie('token', token).json({ user });
});
```

### After (New Layered Architecture)
```javascript
// Separated concerns:
routes/auth.js → authController.login()
                    ↓
services/authService.js → login()
                            ↓
repositories/userRepository.js → findByEmail()
```

## 📚 Additional Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)

## 🚀 Next Steps

1. ✅ Architecture refactored
2. ⏳ Add comprehensive error handling
3. ⏳ Implement logging service
4. ⏳ Add input validation middleware
5. ⏳ Write unit tests for each layer
6. ⏳ Add API documentation with examples
7. ⏳ Implement caching layer
8. ⏳ Add monitoring and metrics

---

**Note**: This architecture provides a solid foundation for scaling the Caliber backend application while maintaining clean, testable, and maintainable code.