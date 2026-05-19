// /api/driveimages.js
// Searches your Google Drive image folders by keyword matching against filenames
// Uses a service account or OAuth — for Vercel, we use the Drive API with an API key
// or better: pre-build a static catalogue from your known folder structure

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query = '', per_page = 8 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  // ── CATALOGUE ──────────────────────────────────────────────────────────────
  // Each image: { id, name, folder }
  // 'id' is the Google Drive file ID → thumbnail URL is:
  //   https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
  // 'name' is the descriptive filename (used for keyword matching)
  // 'folder' is the category label shown on the card

  const CATALOGUE = [
    // BURGERS
    { id:'16iBh0irpDLbW7LIgP6I5VLAldGi_0Ggk', name:'burger-crispy-chicken-purple-slaw', folder:'Burgers' },
    { id:'1NUVeJZ0yeJqHe7srLTN2kVhnvojSKRGr', name:'burger-cheeseburger-lettuce-sauce', folder:'Burgers' },
    { id:'1rqOqI9Tme5A73_I4jZ5wVCteEFjbz7ii', name:'burger-double-cheeseburger-onions-cheese', folder:'Burgers' },
    { id:'1jIkLqugcSjjoO9fuD-eKHlP7yV5gWyCF', name:'burger-classic-cheeseburger-lettuce', folder:'Burgers' },
    { id:'1giNsocpZ1Zn2LxKBHrR3q6ERNUpsdbtA', name:'burger-spicy-chicken-melted-cheese', folder:'Burgers' },
    { id:'1ui81Qspcs8rnPo66tCwooLZ3morpwKwi', name:'burger-grilled-cheeseburger-sauce', folder:'Burgers' },
    { id:'17vlTFcz_xO5j0GnORG6BUKicVgSPeL4t', name:'burger-sesame-cheeseburger', folder:'Burgers' },
    { id:'1yBClJRVBmxxmuF-FWa7MxW72BwoflfmI', name:'burger-bacon-cheeseburger-spinach', folder:'Burgers' },
    { id:'1OGnZoLLbp7JdiDNS5XEWAkd-zYyeMN9U', name:'burger-beef-lettuce-onions', folder:'Burgers' },
    { id:'1e1VU6blb_CzRT8ACiB-8CXNxcRjzreNh', name:'burger-classic-cheeseburger-lettuce-cheese', folder:'Burgers' },
    // PIZZAS
    { id:'1HqHpQXJNuopPVTDlJvmllc7MglQDXKSV', name:'classic-margherita-pizza', folder:'Pizzas' },
    { id:'10FHrrQOxxfmIuVfMNwTQUtrJzDcAHrYl', name:'pepperoni-cheese-pizza', folder:'Pizzas' },
    { id:'14vRi918KQhZE0-N9QoHg2gFpX9oXUnFt', name:'veggie-supreme-pizza', folder:'Pizzas' },
    { id:'15ZEBuIL8qLx1iN2nYSheu2U5vj-VZk62', name:'chicken-tikka-pizza', folder:'Pizzas' },
    { id:'17A2psKuc0kSE8xCsbcabxCHgGlxv--kg', name:'cheesy-deep-dish-pizza', folder:'Pizzas' },
    { id:'18hrplFts4PozTcb0URUUTrcUqlzSFR2o', name:'spicy-beef-pizza', folder:'Pizzas' },
    { id:'18rI-ICWvvKCiFbn-46WRvoY_CCkAy71q', name:'mushroom-cheese-pizza', folder:'Pizzas' },
    { id:'1BTA-0JN8_j2esBWIfbu1_hZV6gsKWrtI', name:'bbq-chicken-pizza', folder:'Pizzas' },
    { id:'1CtyTFhDd-kYMmVP5yz6hkXB0SGxa3jVI', name:'four-cheese-pizza', folder:'Pizzas' },
    { id:'1FA2TgdV_cjHh5vTYISWIrN4OnOxq3uXO', name:'olive-and-tomato-pizza', folder:'Pizzas' },
    { id:'1G32O1XNfkABGG2kr34RJQ4Ei_FwHDyoF', name:'loaded-meat-lovers-pizza', folder:'Pizzas' },
    { id:'1J7HBolYpMRuiUkWn0Ob6PV6E3ameNLwf', name:'thin-crust-pepperoni-pizza', folder:'Pizzas' },
    { id:'1TVBkX5jchG0hw9Ho2wPkQdAJ-MpiVEaT', name:'grilled-chicken-pizza', folder:'Pizzas' },
    { id:'1UIBqLfIrqFj-w25I8opn4d10eEVj2xPW', name:'paneer-tikka-pizza', folder:'Pizzas' },
    { id:'1XcvyrMzkjXLxxDZAgsmaM-0CCCvfxIt0', name:'spicy-sausage-pizza', folder:'Pizzas' },
    { id:'1YP6rP4sq1Vmh-RNJxcM4r5LwJlfD2MlY', name:'cheesy-garlic-pizza', folder:'Pizzas' },
    { id:'1YeUaZpOFDcF4Nx1jzHSHlueYJXn0hML1', name:'hawaiian-pineapple-pizza', folder:'Pizzas' },
    { id:'1ejfbGvtGJflBVHtm3Yn9O0_uo0WH2buT', name:'buffalo-chicken-pizza', folder:'Pizzas' },
    { id:'1fJPG0yVj2etWDkIjzjPnTTUHwhSuiYGU', name:'spinach-feta-pizza', folder:'Pizzas' },
    { id:'1nwN83EgyCk59gnF5neioVNkJvmM9eZbX', name:'mozzarella-basil-pizza', folder:'Pizzas' },
    // PASTA
    { id:'1iFPb1XDXSzLeX0l2HbZ6YCc4L7-ZqHO8', name:'creamy-alfredo-pasta', folder:'Pasta' },
    { id:'1-fnRafgtx_XBYhTKPXlhvssEKVEryvuY', name:'spicy-penne-arrabbiata', folder:'Pasta' },
    { id:'10uo1uf5SCu65-bWmSMXjxqdyUmtUXXNz', name:'chicken-white-sauce-pasta', folder:'Pasta' },
    { id:'1365e07SP-bjLGsTJ5IYoZqETCmw77ME-', name:'cheesy-baked-macaroni', folder:'Pasta' },
    { id:'13rllRDcqOJ5D5V-h1ceaFujcrxXgrCM4', name:'pesto-spaghetti-pasta', folder:'Pasta' },
    { id:'1447X3fb832jTMGYPNSfy3P6wmC90NVGq', name:'shrimp-creamy-pasta', folder:'Pasta' },
    { id:'14RV_x_m2nA_zu1ps-pfJcxb34IJGhBjb', name:'vegetable-penne-pasta', folder:'Pasta' },
    { id:'18VXZRqUk7oxKL0IGXWCbHLjICwR5CZNA', name:'beef-lasagna-pasta', folder:'Pasta' },
    { id:'1BhstjAm2eZXuvfTZW8H-kKYyXudL7e8O', name:'garlic-butter-spaghetti', folder:'Pasta' },
    { id:'1I0kb35J9bzz4PDyQyQJXirUg7IHaDXdU', name:'cheesy-red-sauce-pasta', folder:'Pasta' },
    // RICE
    { id:'1-W2RF6oH1chjN2NI9X9V-AsvHwMCDZuW', name:'chicken-biryani-with-egg', folder:'Rice' },
    { id:'102mqa8MbC1x1z0sWP4c6DyUg4nBnlY9d', name:'spicy-chicken-fried-rice', folder:'Rice' },
    { id:'13B-QaKt1t4eod_dhs6KZ3eT9y99y0KkI', name:'vegetable-fried-rice', folder:'Rice' },
    { id:'144_ssOpdjXvR2WBBzfREjcBFbhivcQrz', name:'beef-biryani-platter', folder:'Rice' },
    { id:'14XUmg_sOy1Qy4tYnv_-1m1io0O7mRcda', name:'chicken-pulao-with-salad', folder:'Rice' },
    { id:'1ALKP9rM9bH4yhy3oy9QigKWTFDKosSyP', name:'shrimp-fried-rice', folder:'Rice' },
    { id:'1AYRCLyg0DZzMtQNgCen5xuahCY6lkbzc', name:'egg-fried-rice', folder:'Rice' },
    { id:'1BKzB97VOFzVkAZV6XPu5I59ZfKsCWJHG', name:'mutton-biryani-with-potato', folder:'Rice' },
    { id:'1BP2PGUdA3n02jLCQdDirBlDpRRpm8v4z', name:'chicken-mandi-rice', folder:'Rice' },
    { id:'1EDQZT1NkhIXAj6F3x-GWOhUo4d2uuZqO', name:'schezwan-fried-rice', folder:'Rice' },
    // SUSHI
    { id:'141_XMMt-1sD8oGq0L4u3260pNPUImMwr', name:'assorted-sushi-platter', folder:'Sushi' },
    { id:'1AhOLjoPMFsKBr9oJrpDMipuAYHuE5IJn', name:'dragon-roll-sushi-platter', folder:'Sushi' },
    { id:'1D0rkDw4PSia05I4TZFii4877ct-Roj34', name:'mixed-sushi-rolls-with-chopsticks', folder:'Sushi' },
    { id:'1KNMEazYRVd1csyLrZzaRYK_2d4vQ9i23', name:'salmon-nigiri-with-soy-sauce', folder:'Sushi' },
    { id:'1KRf1a8b3ZewJAJ2FIfp7_4uWvfKtVJa-', name:'assorted-sushi-party-platter', folder:'Sushi' },
    { id:'1QBmSLax5G8oGW2rV92Xct4DiR9JZg0G1', name:'mixed-maki-rolls-with-dipping-sauces', folder:'Sushi' },
    { id:'1X51hBd_O28QCWkcSxKokaRqi9fZ6gdhq', name:'salmon-roll-on-black-plate', folder:'Sushi' },
    { id:'1_gVPwhSZrJDmszc7KaTL5xoB3hMgGGhR', name:'sushi-platter-with-salad-garnish', folder:'Sushi' },
    { id:'1-3jiAhKTfoWdlC8uVhA71XOq_HjnEEaJ', name:'crab-salad-sushi-roll-close-up', folder:'Sushi' },
    { id:'10gmHaOgk2ETnJQD8x97BD7ruG6GnKD0l', name:'tobiko-california-roll-with-soy-sauce', folder:'Sushi' },
    // NOODLES
    { id:'10iCFcbNWw6DPWgu28gfFFWOfE7DNZjzF', name:'spicy-chicken-ramen-with-egg', folder:'Noodles' },
    { id:'10kxThLI0syZNHVBfxxZktfnY9J8Ph_Iv', name:'vegetable-stir-fry-noodles', folder:'Noodles' },
    { id:'15xTwchQHkWTcQph-JSbeD5_rrbG7bzV3', name:'shrimp-ramen-bowl-with-chopsticks', folder:'Noodles' },
    { id:'17wqNzmihvzk16mtpqgCOYfMdbrwWyGs9', name:'beef-noodles-with-sesame-seeds', folder:'Noodles' },
    { id:'19NhLi8dIPZY2byxuoe0OHrGmp9WueR4A', name:'chicken-chow-mein-with-vegetables', folder:'Noodles' },
    { id:'1DJOMxywu1XozCEV1PBelwxU-esSpfPJ1', name:'spicy-korean-ramen-noodles', folder:'Noodles' },
    { id:'1HvoTbpqmaDPaCW1AKVbsvlknDKJYo-k6', name:'garlic-noodles-with-herbs', folder:'Noodles' },
    { id:'1K3uXEuZFjfQMPDLgeKMqegi2VA3MNZDB', name:'seafood-ramen-with-shrimp-and-egg', folder:'Noodles' },
    { id:'1NBx3iFxuw61Ew0zLf_WD1J9Z82kmlO1x', name:'vegetable-ramen-soup-bowl', folder:'Noodles' },
    { id:'1OiELEm8gPoVM58h9BBT4B-0VX-w0K87e', name:'chicken-noodles-with-chili-flakes', folder:'Noodles' },
    // FRIES
    { id:'1-wjMd_c4Wh8_b3bdRhLguvCb4qG5tBY6', name:'cheesy-bacon-loaded-fries', folder:'Fries' },
    { id:'1542S1KexNig4wJ6vu1-UUiESG1sQfLcU', name:'classic-french-fries-in-paper-tray', folder:'Fries' },
    { id:'173hqtV_IabCBuMHYnLLpaf7JyWZU6uF6', name:'seasoned-fries-in-fry-basket', folder:'Fries' },
    { id:'18sWaVR5BUNm9YmkslPqW6tJouccwu66y', name:'french-fries-with-ketchup-dip', folder:'Fries' },
    { id:'1EwLCXPVLqXu64zqw_iL4nXUYCNQR0rKY', name:'bowl-of-crispy-french-fries', folder:'Fries' },
    { id:'1HLl8bJbvUM0wNe-_2-lExi_LWW5aO7vF', name:'frozen-straight-cut-fries', folder:'Fries' },
    { id:'1Hk4wiXFapgbETgNHd4owB7v00i5x4B1X', name:'boxed-fries-on-pink-background', folder:'Fries' },
    { id:'1I9VhHPkDvWtPAujOz03tn3pV3gEJ_uK0', name:'chili-cheese-loaded-fries', folder:'Fries' },
    { id:'1IXoN0X5fIkvpuTkupAAOozqeMPb9CLxB', name:'crinkle-cut-fries-bowl', folder:'Fries' },
    { id:'1NRaTCQQYzdccdD5Qain_jCJ-J0hvMjJR', name:'loaded-steak-fries-with-cheese-and-guacamole', folder:'Fries' },
    // FRIED CHICKEN
    { id:'12lkWsX16JR_0zAvFrQb-txhnTeubV-Wc', name:'crispy-fried-chicken-with-potato-wedges', folder:'Fried Chicken' },
    { id:'17z2qxyLTWg9SHbcwbTMQDOe7O4JTEm3F', name:'fried-chicken-drumsticks-on-wooden-board', folder:'Fried Chicken' },
    { id:'19E9ixYhjufEIdqfeTcSOsjn0-EWzURMi', name:'spicy-buffalo-chicken-wings', folder:'Fried Chicken' },
    { id:'1AjPl3q2UDKIoMBoL-9HYSLosFECPzLY4', name:'crispy-fried-chicken-pieces-stack', folder:'Fried Chicken' },
    { id:'1BO7uuKE5nQssx8OdMKOf6P5Ih6ffqX4a', name:'glazed-chicken-wings-in-white-bowl', folder:'Fried Chicken' },
    { id:'1BwMKlViXM0eFqHCarBoweH4ULbXk86a_', name:'crispy-popcorn-chicken-bowl', folder:'Fried Chicken' },
    { id:'1JS76sDxt0yebIFhC5n4MGLgAWrJ992S8', name:'fried-chicken-bites-in-tray', folder:'Fried Chicken' },
    { id:'1QXAOJ_z8phbxFNYy2KOjDtLcephlSFad', name:'golden-chicken-wings-close-up', folder:'Fried Chicken' },
    { id:'1RTwi5yYYp8tRtvzeJVLastaUe3jDAq8n', name:'southern-fried-chicken-in-green-bowl', folder:'Fried Chicken' },
    { id:'1Tagq2Q6cqZw5BmXDyT0r-pg5VEhmsmin', name:'crispy-chicken-tenders-platter', folder:'Fried Chicken' },
    // ICE CREAM
    { id:'116cjT_WUc-sEJ1LEOU_Hv27cnBz_Xf6D', name:'banana-split-sundae-with-cherries', folder:'Ice Cream' },
    { id:'11SJk4KEGhgvxEZLeOhoFyT2Fn6ughMhq', name:'chocolate-sundae-in-glass-cup', folder:'Ice Cream' },
    { id:'17e_r4JkJfyk1yi1nTBIYRzSgbaXGg7sC', name:'mochi-ice-cream-assortment', folder:'Ice Cream' },
    { id:'1FRoVu3yc-G3QKq7uVKwfqIplYOVYcCxb', name:'waffle-cone-dessert-platter', folder:'Ice Cream' },
    { id:'1FygdxZx6dKAG6GYIwR13YmjE-KANP2b1', name:'vanilla-walnut-ice-cream-scoops', folder:'Ice Cream' },
    { id:'1G_RnB0M7hptKknSgFl19MOzZ_7o9vsWf', name:'affogato-coffee-ice-cream', folder:'Ice Cream' },
    { id:'1KF6Qz_FckUrR4vGjGwa8g7WHvMj8SLnL', name:'vanilla-bean-ice-cream-bowls', folder:'Ice Cream' },
    { id:'1KLUcsMs7OLapl_VK_KGOewN1WvLGNb0D', name:'raspberry-waffle-cone-ice-cream', folder:'Ice Cream' },
    { id:'1LGUc8wPp8N_XNtf9yb7WGGSoLlVD8V1r', name:'chocolate-drizzle-sundae', folder:'Ice Cream' },
    { id:'1Tb63Tj5VzEhAsn6T1RUxmdSzzXx3tENN', name:'mango-ice-cream-scoops-with-cone', folder:'Ice Cream' },
    // DRINKS
    { id:'1AGVSFpSXaUJueTeD2H9Re-nRKWwqYysG', name:'hot-coffee-cups-with-cinnamon', folder:'Drinks' },
    { id:'1Hl_-mjnwHvmgmTbPycW2eiBHujcokTWW', name:'three-chocolate-milkshakes', folder:'Drinks' },
    { id:'1NjFYnQPQECWa5_H2vLE3UYAr_7VJHAH9', name:'fruit-iced-cocktail', folder:'Drinks' },
    { id:'1OXlSH4IF_qsosd2bFyMIUQH38K9wt1Lt', name:'citrus-drink-on-yellow-saucer', folder:'Drinks' },
    { id:'1Q8nuab-oA90yGpHvN96Kbmb2ZbxUPwh6', name:'black-coffee-in-white-cup', folder:'Drinks' },
    { id:'1dQlpminFYWcQoIZqxrV9IuLcXzGVi8uz', name:'chocolate-milkshake-with-cream', folder:'Drinks' },
    { id:'1iuZx3X5rpDwMwY0MKg3zlNgnIGdzfmqe', name:'tall-red-berry-drink', folder:'Drinks' },
    { id:'1tYyA7eE1yDe6CWXxxbkwWPE2vhLjAG3V', name:'colorful-bottled-mocktails', folder:'Drinks' },
    { id:'1xfTy1qgbxaNWSRvXLmtt7-31tfhnuist', name:'cappuccino-with-spices', folder:'Drinks' },
    { id:'19f2mgUO3MwM0bpsz6Lnd342c3BLrHoVc', name:'green-tea-cup', folder:'Drinks' },
  ];

  // ── Fuzzy keyword search ───────────────────────────────────────────────────
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);

  const scored = CATALOGUE.map(item => {
    const haystack = (item.name + ' ' + item.folder).toLowerCase().replace(/-/g,' ');
    const score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0);
    return { item, score };
  })
  .filter(x => x.score > 0)
  .sort((a,b) => b.score - a.score)
  .slice(0, parseInt(per_page));

  const photos = scored.map(({ item }) => ({
    id:           item.id,
    thumb:        `https://drive.google.com/thumbnail?id=${item.id}&sz=w400`,
    full:         `https://drive.google.com/thumbnail?id=${item.id}&sz=w1200`,
    page:         `https://drive.google.com/file/d/${item.id}/view`,
    title:        item.name.replace(/-/g,' '),
    photographer: 'Your Team',
    source:       `My Images · ${item.folder}`,
    isLocal:      true,
    folder:       item.folder,
  }));

  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json({ photos });
}
