const sqlite3 =  require('sqlite3');
const { open } = require('sqlite');

const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const Handlebars = require('handlebars');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
//const sqlite3 = require('sqlite3').verbose();
const { engine } = require('express-handlebars');
const exphbs = require('express-handlebars');
const app = express();
const port = 8080;

// Подключение к базе данных SQLite
(async () => {
  // open the database
  const db = await open({
    filename: './db/database.db',
    driver: sqlite3.Database

    
  });

  // console.log(bcrypt.hashSync('qwezxc', 10));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Сессия для отображения alert-окна при успешном бронировании квартиры
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'qwe',
  resave: false,
  saveUninitialized: true
}));


// Маршрут для страницы входа
app.get('/admin/login', (req, res) => {
  res.render('login');
});

// Обработка формы входа
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);
    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.adminId = admin.id;
      return res.redirect('/admin');
    }
    res.render('login', { error: 'Неправильный логин или пароль' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Middleware для проверки аутентификации администратора
function checkAuth(req, res, next) {
  if (req.session.adminId) {
    return next();
  }
  res.redirect('/admin/login');
}

// Маршрут для админ-панели
app.get('/admin', checkAuth, async (req, res) => {
  try {
    const apartments = await db.all('SELECT * FROM apartments');
    res.render('admin', { apartments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Middleware для переноса сообщений из сессии в локальные переменные
app.use((req, res, next) => {
  res.locals.success_msg = req.session.success_msg;
  delete req.session.success_msg;
  next();
});

  // Middleware для статических файлов (изображений)
app.use(express.static(path.join(__dirname, 'public')));

// Настройка Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main', // задаем основной макет
  layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Установка статической папки для CSS и JS файлов
app.use(express.static(path.join(__dirname, 'public')));

// Подключение body-parser для обработки POST-запросов
app.use(bodyParser.urlencoded({ extended: true }));

// Маршрут для главной страницы
app.get('/', async(req, res) => {
  const db_news = await db.all('SELECT * FROM news');
  const db_apart = await db.all('SELECT * FROM apartments');
  res.render('index', { news: db_news, apartments: db_apart });
});

// Обработка POST-запроса с формы
app.post('/submit', async (req, res) => {
  const { email, phone, name } = req.body;
  try {
    const stmt = await db.prepare("INSERT INTO users (email, phone, name) VALUES (?, ?, ?)");
    await stmt.run(email, phone, name);
    await stmt.finalize();
    req.session.success_msg = `Спасибо, ${name}! Мы свяжемся с вами по указанным контактам.`;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при сохранении данных.');
  }
});

//Маршрут для главной страницы с квартирами
app.get('/filter-apartments', async (req, res) => {
  try {
    const { resaleOrNew, rooms, price, district } = req.query;

    let query = "SELECT * FROM apartments WHERE 1=1";
    const params = [];

    if (resaleOrNew && resaleOrNew !== 'all') {
      query += " AND resaleOrNew = ?";
      params.push(resaleOrNew);
    }
    if (rooms && rooms !== 'all') {
      query += " AND rooms = ?";
      params.push(rooms);
    }
    if (price && price !== 'all') {
      if (price === '3000000') {
        query += " AND price <= ?";
        params.push(3000000);
      } else if (price === '5000000') {
        query += " AND price BETWEEN ? AND ?";
        params.push(3000001, 5000000);
      } else if (price === '10000000') {
        query += " AND price BETWEEN ? AND ?";
        params.push(5000001, 10000000);
      }
    }
    if (district && district !== 'all') {
      query += " AND district = ?";
      params.push(district);
    }
    const apartments = await db.all(query, params);

    res.render('apartments', { apartments: db_apartments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});


// Маршрут для отображения всех квартир
app.get('/apartments', async (req, res) => {
  try {
    const { resaleOrNew, rooms, price, district } = req.query;

    let query = "SELECT * FROM apartments WHERE 1=1";
    const params = [];

    if (resaleOrNew && resaleOrNew !== 'all') {
      query += " AND resaleOrNew = ?";
      params.push(resaleOrNew);
    }
    if (rooms && rooms !== 'all') {
      query += " AND rooms = ?";
      params.push(rooms);
    }
    if (price && price !== 'all') {
      if (price === '3000000') {
        query += " AND price <= ?";
        params.push(3000000);
      } else if (price === '5000000') {
        query += " AND price BETWEEN ? AND ?";
        params.push(3000001, 5000000);
      } else if (price === '10000000') {
        query += " AND price BETWEEN ? AND ?";
        params.push(5000001, 10000000);
      } else if (price === '10000001') {
        query += " AND price >= ?";
        params.push(10000001);
      }
    }
    if (district && district !== 'all') {
      query += " AND district = ?";
      params.push(district);
    }
    const apartments = await db.all(query, params);

    const resaleOrNewOptions = (await db.all('SELECT DISTINCT resaleOrNew FROM apartments')).map(option => ({
      resaleOrNew: option.resaleOrNew,
      isSelected: option.resaleOrNew === resaleOrNew
    }));

    const roomsOptions = (await db.all('SELECT DISTINCT rooms FROM apartments')).map(option => ({
      rooms: option.rooms,
      isSelected: option.rooms == rooms
    }));

    const districtOptions = (await db.all('SELECT DISTINCT district FROM apartments')).map(option => ({
      district: option.district,
      isSelected: option.district === district
    }));

    const priceOptions = [
      { value: '3000000', label: 'до 3 млн', isSelected: price === '3000000' },
      { value: '5000000', label: '3-5 млн', isSelected: price === '5000000' },
      { value: '10000000', label: '5-10 млн', isSelected: price === '10000000' },
      { value: '10000001', label: 'более 10 млн', isSelected: price === '10000001' }
    ];

    res.render('apartments', {
      apartments,
      resaleOrNewOptions,
      roomsOptions,
      districtOptions,
      priceOptions,
      selectedFilters: {
        isAllResaleOrNew: resaleOrNew === 'all',
        isAllRooms: rooms === 'all',
        isAllPrice: price === 'all',
        isAllDistrict: district === 'all'
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Маршрут для отображения отдельной квартиры
app.get('/apartments/:id', async(req, res) => {
  const stmt = await db.prepare('SELECT * FROM apartments WHERE id = ?')
  await stmt.bind({ 1: req.params.id  })
  let db_news = await stmt.get()
  res.render('apartments_detail', { apartments: db_news });
})

// Маршрут для отображения отдельной новости
app.get('/news/:id', async(req, res) => {
  const stmt = await db.prepare('SELECT * FROM news WHERE id = ?')
  await stmt.bind({ 1: req.params.id  })
  let db_apart = await stmt.get()
  res.render('news_detail', { news: db_apart });
});

// Маршрут для отображения отдельной новости
// app.get('/news/:id', (req, res) => {
//   const newsId = req.params.id;
//   db.get("SELECT * FROM news WHERE id = ?", [newsId], (err, row) => {
//     if (err) {
//       return res.status(500).send('Ошибка при получении новости.');
//     }
//     if (!row) {
//       return res.status(404).send('Новость не найдена.');
//     }
//     res.render('news_detail', { news: row });
//   });
// });

//Хелпер для группировки предметов
Handlebars.registerHelper('group', function(items, groupSize) {
  let groupedItems = [];
  for (let i = 0; i < items.length; i += groupSize) {
      groupedItems.push(items.slice(i, i + groupSize));
  }
  return groupedItems;
});



app.get('/filter-apartments', async (req, res) => {
  try {
      const resaleOrNewOptions = await db.all('SELECT DISTINCT resaleOrNew FROM apartments');
      const roomsOptions = await db.all('SELECT DISTINCT rooms FROM apartments');
      const districtOptions = await db.all('SELECT DISTINCT district FROM apartments');
      const priceOptions = [
          { value: '3000000', label: 'до 3 млн' },
          { value: '5000000', label: '3-5 млн' },
          { value: '10000000', label: '5-10 млн' }
      ];

      res.render('/apartments', {
          resaleOrNewOptions,
          roomsOptions,
          districtOptions,
          priceOptions
      });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Ошибка сервера');
  }
});

// Маршруты для бронирования квартиры
app.get('/book/:id', async(req, res) => {
  const apartmentId = req.params.id;
  res.render('book', { apartmentId });
});

// Маршрут для обработки формы бронирования и записи в бд
app.post('/book', async(req, res) => {
  const { apartmentId, name, phone, email } = req.body;
  try {
    await db.run('INSERT INTO bookings (apartmentId, name, phone, email) VALUES (?, ?, ?, ?)', [apartmentId, name, phone, email]);
    await db.run('UPDATE apartments SET isBooked = TRUE WHERE id = ?', [apartmentId]);
    req.session.success_msg = 'Квартира успешно забронирована!';
    res.redirect('/apartments');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  } 
});

//Маршрут для снятия бронирования
app.post('/admin/unbook', checkAuth, async (req, res) => {
  const { id, apartmentId } = req.body;
  console.log(id, apartmentId);
  try {
    await db.run('UPDATE apartments SET isBooked = FALSE WHERE id = ?', [apartmentId]);
    await db.run('DELETE FROM bookings WHERE apartmentId = ?', [apartmentId]);
    req.session.success_msg = 'Бронирование успешно снято!';
    res.redirect('/admin/edit_apartments');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Роуты редактирования квартир и новостей
// Роут редактирования новостей
app.get('/admin/edit_news', checkAuth, async (req, res) => {
  try {
    const news = await db.all('SELECT * FROM news');
    res.render('edit_news', { news });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Роут для добавления новости
app.post('/admin/add_news', checkAuth, async (req, res) => {
  const { image_url, content, full_content } = req.body;
  try {
    await db.run('INSERT INTO news (image_url, content, full_content) VALUES (?, ?, ?)', [image_url, content, full_content]);
    res.redirect('/admin/edit_news');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Роут для удаления новости
app.post('/admin/delete_news', checkAuth, async (req, res) => {
  const { id } = req.body;
  try {
    await db.run('DELETE FROM news WHERE id = ?', id);
    res.redirect('/admin/edit_news');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Роут для редактирования квартиры
app.get('/admin/edit_apartments', checkAuth, async (req, res) => {
  try {
    const apartments = await db.all('SELECT * FROM apartments');
    res.render('edit_apartments', { apartments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Роут для добавления квартиры
app.post('/admin/add_apartment', checkAuth, async (req, res) => {
  const { image_url, resaleOrNew, rooms, total_area, district, floors, price, content, address } = req.body;
  try {
    await db.run('INSERT INTO apartments (image_url, resaleOrNew, rooms, total_area, district, floors, price, content, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                 [image_url, resaleOrNew, rooms, total_area, district, floors, price, content, address]);
    res.redirect('/admin/edit_apartments');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

// Роут для удаления квартиры
app.post('/admin/delete_apartment', checkAuth, async (req, res) => {
  const { id } = req.body;
  try {
    await db.run('BEGIN TRANSACTION');

    await db.run('DELETE FROM apartments WHERE id = ?', id);

    await db.run('COMMIT');

    res.redirect('/admin/edit_apartments');
  } catch (err) {
    await db.run('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});
// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
})()

