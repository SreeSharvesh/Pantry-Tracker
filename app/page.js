'use client'
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Modal, TextField, Button, Stack, List, ListItem, ListItemText, Collapse } from "@mui/material";
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, firestore } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState({});
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const dropdownRef = useRef(null);

  const fetchRecipes = async () => {
    if (!user) return;

    setLoadingRecipes(true);
    try {
      const ingredientList = inventory.map(item => item.name).join(', ');

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "user", content: `Suggest 3 recipes based on these ingredients: ${ingredientList}` }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`,  // Replace with your actual API key
        },
      });

      const suggestedRecipes = response.data.choices[0].message.content.split('\n').filter(line => line.trim());
      setRecipes(suggestedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const categories = {
    "Fruits": ["Apple", "Banana", "Orange","Mango","Kiwi","Musk melon","Water melon","Jack Fruit"],
    "Vegetables": ["Potato","Tomato","Onion","Garlic","Ginger","Cauliflower","Ridge Gourd","Sweet Peas","Carrot", "Broccoli", "Spinach"],
    "Dairy": ["Milk","Butter","Cheese", "Yogurt"],
    "Dry Fruits":["Almonds","Cashew","Walnut","Raisin","Flax seeds","Pumpkin seeds"],
    "Others":["Bread","Wheat Flour","Rice Flour","Corn Flour"]
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        updateInventory();
      } 
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateInventory = async () => {
    if (!user) return;

    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item) => {
    if (!user) return;

    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    if (!user) return;

    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }

    await updateInventory();
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const toggleDropdown = () => setDropdownOpen(prev => !prev);
  const closeDropdown = () => setDropdownOpen(false);

  const toggleCategory = (category) => {
    setCategoryOpen(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navigation Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          boxShadow: 1,
          position: 'relative'
        }}
      >
        <Typography variant="h6">Inventory System</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {user ? (
            <>
              <Button color="inherit" onClick={handleSignOut} sx={{ color: 'white' }}>Sign Out</Button>
              <Button color="inherit" onClick={handleOpen} sx={{ color: 'white' }}>Add Item</Button>
            </>
          ) : (
            <Button color="inherit" onClick={handleSignIn} sx={{ color: 'white' }}>Sign In with Google</Button>
          )}
          <Box component="span" sx={{ fontSize: '24px', cursor: 'pointer' }} onClick={toggleDropdown} ref={dropdownRef}>
            &#9776;
          </Box>
          {dropdownOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                bgcolor: 'white',
                color: 'black',
                boxShadow: 2,
                borderRadius: 1,
                overflow: 'hidden',
                mt: 1
              }}
            >
              <Box
                sx={{ px: 5, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.200' } }}
                onClick={closeDropdown}
              >
                Profile
              </Box>
              <Box
                sx={{ px: 5, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.200' } }}
                onClick={closeDropdown}
              >
                Settings
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar with Categories */}
        <Box
          sx={{
            width: '300px',
            bgcolor: '#f0f0f0',
            p: 2,
            boxShadow: 2,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" mb={2}>Categories</Typography>
          <List>
            {Object.keys(categories).map((category) => (
              <Box key={category}>
                <ListItem button onClick={() => toggleCategory(category)}>
                  <ListItemText primary={category} />
                  <Box component="span" sx={{ ml: 'auto' }}>
                    {categoryOpen[category] ? '-' : '+'}
                  </Box>
                </ListItem>
                <Collapse in={categoryOpen[category]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {categories[category].map((item) => (
                      <ListItem button key={item} sx={{ pl: 4 }} onClick={() => addItem(item)}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}
          </List>
        </Box>

        {/* Inventory List */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2, width: '80%', maxWidth: '600px' }}
            />

            <Box width="100%" maxWidth="800px">
              <Box
                width="100%"
                bgcolor="#f0f0f0"
                p={2}
                display="flex"
                justifyContent="center"
              >
                <Typography variant="h4" color="#333">Inventory Items</Typography>
              </Box>

              <Stack spacing={2} mt={2} px={1}>
                {filteredInventory.map(({ name, quantity }) => (
                  <Box
                    key={name}
                    display="grid"
                    gridTemplateColumns="2fr 1fr 1fr"
                    alignItems="center"
                    bgcolor="#f9f9f9"
                    boxShadow={1}
                    p={2}
                    borderRadius={1}
                  >
                    <Typography variant="h6" color="#333">
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                    <Typography variant="h6" color="#333" textAlign="center">
                      {quantity}
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button variant="contained" color="primary" onClick={() => addItem(name)}>
                        Add
                      </Button>
                      <Button variant="contained" color="secondary" onClick={() => removeItem(name)}>
                        Remove
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Recipe Suggestions */}
          <Box display="flex" justifyContent="center" alignItems="center" my={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchRecipes}
              disabled={loadingRecipes}
            >
              {loadingRecipes ? 'Loading Recipes...' : 'Suggest Recipes'}
            </Button>
          </Box>

          <Box mt={4}>
            <Typography variant="h5">Recipe Suggestions</Typography>
            {recipes.length > 0 ? (
              <List>
                {recipes.map((recipe, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recipe} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="textSecondary">
                No recipes found. Try adding more items to your inventory.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
