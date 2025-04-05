import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import supabase from '../../lib/supabaseClient';
import './Feed.css';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTouch, setStartTouch] = useState(0);
  const [touching, setTouching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPosts = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        setLoading(false);
        return;
      }

      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken');
        navigate('/login');
        setLoading(false);
        return;
      }

      try {
        // Recupera i post tramite Supabase
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .neq('status', 'hidden'); // Filtro per post non nascosti

        if (error) {
          console.error('Errore nel caricamento dei post:', error);
        } else {
          setPosts(data);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei post:', error);
      }
      setLoading(false);
    };

    loadPosts();
  }, [navigate]);

  useEffect(() => {
    setExpanded(false);
  }, [currentIndex]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsCommentsOpen(false);
    }
  };

  const handleMenuClick = (action) => {
    if (action === 'home') navigate('/feed');
    else if (action === 'carica') navigate('/carica');
    else if (action === 'logout') handleLogout();
  };

  const handleShare = (postId) => {
    const postUrl = `http://192.168.1.16:5000/posts/${postId}`;
    navigator.clipboard.writeText(postUrl);
    alert("Link copiato negli appunti!");
  };

  const handleTouchStart = (e) => {
    setStartTouch(e.touches[0].clientY);
    setTouching(true);
  };

  const handleTouchMove = (e) => {
    if (!touching || isCommentsOpen) return;

    const diff = startTouch - e.touches[0].clientY;
    if (Math.abs(diff) > 30) {
      if (diff > 0 && currentIndex < posts.length - 1) {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prevIndex) => prevIndex - 1);
      }
      setTouching(false);
    }
  };

  const handleTouchEnd = () => {
    setTouching(false);
  };

  const toggleDescription = () => {
    setExpanded(!expanded);
  };

  const handleKeydown = useCallback(
    (e) => {
      if (isCommentsOpen) return;

      if (e.key === 'ArrowDown') {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, posts.length - 1));
      } else if (e.key === 'ArrowUp') {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      }
    },
    [posts.length, isCommentsOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [handleKeydown]);

  const toggleComments = async () => {
    setIsCommentsOpen(!isCommentsOpen);
    if (!isCommentsOpen) {
        setIsMenuOpen(false);
        const postId = posts[currentIndex]?.id;
        if (postId) {
            fetchComments(postId); // Carica i commenti tramite Supabase
        }
    }
  };

  const fetchComments = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId); // Ottieni i commenti per un post specifico

      if (error) {
        console.error('Errore nel recupero dei commenti:', error);
      } else {
        setComments(data); // Imposta i commenti
      }
    } catch (error) {
      console.error('Errore nel recupero dei commenti:', error);
    }
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const postId = posts[currentIndex]?.id;

    if (!newComment || !postId) {
      console.error("Commento o post_id mancante.");
      return;
    }

    console.log("Invio commento:", newComment, "Post ID:", postId);

    try {
      // Inserimento del commento tramite Supabase
      const { error } = await supabase
        .from('comments')
        .insert([
          { comment: newComment, post_id: postId } // Inserisci il commento per il post specificato
        ]);

      if (error) {
        console.error('Errore nell\'invio del commento:', error);
      } else {
        setNewComment('');
        toggleComments(); // Ricarica i commenti
      }
    } catch (error) {
      console.error("Errore nell'invio del commento:", error);
    }
  };

  const handleReportPost = async (postId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("Token mancante, impossibile segnalare il post.");
        return;
    }

    try {
        // Verifica se l'utente ha già segnalato il post
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', decodedToken.id); // Verifica se l'utente ha già segnalato il post

        if (error) {
          console.error('Errore nel controllo della segnalazione:', error);
        } else if (data.length > 0) {
            alert("Hai già segnalato questo post.");
            return;
        }

        // Se non è stato segnalato, procedi con la segnalazione
        await supabase
          .from('reports')
          .insert([{ post_id: postId, user_id: decodedToken.id }]);

        alert("Post segnalato con successo!");
    } catch (error) {
        console.error('Errore nella segnalazione del post:', error);
    }
  };

  return (
    <div className={`feed-container ${isCommentsOpen ? 'no-scroll' : ''}`} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="hamburger-menu" onClick={toggleMenu}>
        &#9776;
      </div>

      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <button onClick={() => handleMenuClick('home')}>Home</button>
          </li>
          <li>
            <button onClick={() => handleMenuClick('carica')}>Carica Spotted</button>
          </li>
          <li>
            <button onClick={() => handleMenuClick('profilo')}>Profilo</button>
          </li>
          <li>
            <button onClick={() => handleMenuClick('logout')}>Logout</button>
          </li>
        </ul>
      </div>

      <div className="feed-content">
        {loading ? (
          <p>Caricamento dei post...</p>
        ) : posts.length === 0 ? (
          <p>Nessun post disponibile.</p>
        ) : (
          <div className="post-item">
            <div className="post-options">
              <button className="options-button" onClick={() => setIsOptionsOpen(!isOptionsOpen)}>
                ⋮
              </button>

              {isOptionsOpen && (
                <div className="options-menu">
                  <button className="options-item" onClick={() => handleShare(posts[currentIndex].id)}>
                    📤 Condividi
                  </button>
                  <button className="options-item report" onClick={() => handleReportPost(posts[currentIndex].id)}>
                    🚨 Segnala
                  </button>
                </div>
              )}
            </div>

            <button className="comment-button" onClick={toggleComments}>
              💬
            </button>

            <div className="post-image-container">
              <img
                src={`http://192.168.1.16:5000${posts[currentIndex].photo_url}`}
                alt="Post"
                className="post-image"
              />
              <div className="post-description-container">
                <p className={`post-description ${expanded ? 'expanded' : ''}`}>
                  {expanded
                    ? posts[currentIndex].description
                    : (posts[currentIndex].description || '').slice(0, 15) +
                      (posts[currentIndex].description?.length > 15 ? '...' : '')}
                  {posts[currentIndex].description?.length > 15 && (
                    <span className="expand-text" onClick={toggleDescription}>
                      {expanded ? ' Nascondi' : ' Mostra di più'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isCommentsOpen && (
        <div className={`comments-section ${isCommentsOpen ? 'open' : ''}`}>
          <h3>Commenti:</h3>
          <ul>
            {comments.length === 0 ? (
              <li>Nessun commento ancora.</li>
            ) : (
              comments.map((comment) => (
                <li key={comment.id}>{comment.comment}</li>
              ))
            )}
          </ul>

          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              className="comment-input"
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Aggiungi un commento..."
              rows="2"
            ></textarea>
            <button type="submit" className="comment-submit">
              ➡️
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Feed;
