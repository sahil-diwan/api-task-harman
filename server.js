const express = require('express');
const app = express();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const PORT = 3000;

app.use(express.json())

// Define your categories data
const categories = [
  {
    id: 1,
    name: 'Women',
    parentId: null
  },
  {
    id: 2,
    name: 'Men',
    parentId: null
  },
  {
    id: 3,
    name: 'Clothing',
    parentId: 1
  },
  {
    id: 4,
    name: 'T-shirts',
    parentId: 1
  },
  {
    id: 5,
    name: 'Dress',
    parentId: 3
  },
  {
    id: 6,
    name: 'Casual Dresses',
    parentId: 5
  },
  {
    id: 7,
    name: 'Party Dresses',
    parentId: 5
  },
  {
    id: 8,
    name: 'Printed T-shirts',
    parentId: 4
  },
  {
    id: 9,
    name: 'Causal T-Shirts',
    parentId: 4
  },
  {
    id: 10,
    name: 'Plain T-Shirts',
    parentId: 4
  },
  {
    id: 11,
    name: 'Footwear',
    parentId: 2
  },
  {
    id: 12,
    name: 'T-Shirts',
    parentId: 2
  },
  {
    id: 13,
    name: 'Shirts',
    parentId: 2
  },
  {
    id: 14,
    name: 'Branded',
    parentId: 11
  },
  {
    id: 15,
    name: 'Non-Branded',
    parentId: 11
  },
  {
    id: 16,
    name: 'Printed T-Shirts',
    parentId: 12
  },
  {
    id: 17,
    name: 'Causual T-Shirts',
    parentId: 12
  },
  {
    id: 18,
    name: 'Plain T-Shirts',
    parentId: 12
  },
  {
    id: 19,
    name: 'Party Shirts',
    parentId: 13
  },
  {
    id: 20,
    name: 'Casual Shirts',
    parentId: 13
  },
  {
    id: 21,
    name: 'Plain Shirts',
    parentId: 13
  }
];

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Hierarchical Categories API',
      version: '1.0.0',
      description: 'API endpoints to manage hierarchical categories',
    },
  },
  apis: ['./server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /categories:
 *   get:
 *     description: Get Categories Hierarchy
 *     responses:
 *       200:
 *         description: Success
 * 
 */
app.get('/categories', (req, res) => {
  const hierarchicalCategories = buildHierarchy(categories, null);
  res.json(hierarchicalCategories);
});


/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     description: Get Categories by Id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Successful operation
 */
app.get('/categories/:id', (req, res) => {
  const categoryId = parseInt(req.params.id);
  const category = findCategory(categoryId);

  if (category) {
    res.json(category);
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       description: Category object to be created
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The category name.
 *               parentId:
 *                 type: integer
 *                 description: The ID of the parent category.
 *     responses:
 *       200:
 *         description: Successful operation
 */
app.post('/categories', (req, res) => {
  const { name, parentId } = req.body;

  if (!name || !parentId) {
    res.status(400).json({ message: 'Name and parentId are required' });
    return;
  }

  const newCategoryId = generateCategoryId();
  const newCategory = {
    id: newCategoryId,
    name,
    parentId
  };

  categories.push(newCategory);
  res.status(201).json(newCategory);
});


/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       description: Category object to be updated
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The category name.
 *               parentId:
 *                 type: integer
 *                 description: The ID of the parent category.
 *     responses:
 *       200:
 *         description: Successful operation
 */
app.put('/categories/:id', (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { name, parentId } = req.body;
  const category = findCategory(categoryId);

  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }

  category.name = name || category.name;
  category.parentId = parentId || category.parentId;

  res.json(category);
});


/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     description: Get Categories by Id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Successful operation
 */
app.delete('/categories/:id', (req, res) => {
  const categoryId = parseInt(req.params.id);
  const categoryIndex = findCategoryIndex(categoryId);

  if (categoryIndex === -1) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }

  const deletedCategory = categories.splice(categoryIndex, 1);
  res.json(deletedCategory[0]);
});

// Function to build the hierarchical/tree view of categories
function buildHierarchy(categories, parentId) {
  const result = [];

  categories.forEach(category => {
    if (category.parentId === parentId) {
      const children = buildHierarchy(categories, category.id);
      if (children.length > 0) {
        category.children = children;
      }
      result.push(category);
    }
  });

  return result;
}

// Function to find a category by ID
function findCategory(categoryId) {
  return categories.find(category => category.id === categoryId);
}

// Function to find the index of a category by ID
function findCategoryIndex(categoryId) {
  return categories.findIndex(category => category.id === categoryId);
}

// Function to generate a new category ID
function generateCategoryId() {
  return Math.max(...categories.map(category => category.id)) + 1;
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



