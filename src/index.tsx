import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import './index.css';
import { setupDPadNavigation } from './lib/navigation';
setupDPadNavigation();
import App from './App';
import HomePage from './pages/Home';
import DetailPage from './pages/Detail';
import PlayerPage from './pages/Player';
import SearchPage from './pages/Search';
import MoviesPage from './pages/Movies';
import TVShowsPage from './pages/TVShows';
import SettingsPage from './pages/Settings';
import FavouritesPage from './pages/Favourites';

render(
  () => (
    <Router root={App}>
      <Route path="/" component={HomePage} />
      <Route path="/discover" component={HomePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/movies" component={MoviesPage} />
      <Route path="/tv" component={TVShowsPage} />
      <Route path="/favourites" component={FavouritesPage} />
      <Route path="/movie/:id" component={DetailPage} />
      <Route path="/tv/:id" component={DetailPage} />
      <Route path="/player" component={PlayerPage} />
      <Route path="/settings" component={SettingsPage} />
    </Router>
  ),
  document.getElementById('root')!
);
