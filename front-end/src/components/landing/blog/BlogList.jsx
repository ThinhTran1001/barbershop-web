import React, { useState, useEffect } from 'react';
import { Pagination } from 'antd';
import BlogCard from './BlogCard';
import { blogPosts } from './BlogData';

const POSTS_PER_PAGE = 5;

const BlogList = ({ sort, category }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    let posts = [...blogPosts];

   
    if (category) {
      posts = posts.filter(post => post.category === category);
    }


    if (sort === 'date') {
      posts.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('/'));
        const dateB = new Date(b.date.split('/').reverse().join('/'));
        return dateB - dateA;
      });
    } else if (sort === 'views') {
      posts.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    setFilteredPosts(posts);
    setCurrentPage(1); 
  }, [sort, category]);

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <>
      {currentPosts.map(post => (
        <BlogCard key={post.id} {...post} />
      ))}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination
          current={currentPage}
          pageSize={POSTS_PER_PAGE}
          total={filteredPosts.length}
          onChange={setCurrentPage}
        />
      </div>
    </>
  );
};

export default BlogList;
