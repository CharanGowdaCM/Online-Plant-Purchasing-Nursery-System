import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import adminService from '../../services/adminService';
import profileService from '../../services/profileService';
import authService from '../../services/authService';
import './SuperAdminDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // State for analytics data
  const [analytics, setAnalytics] = useState(null);
  const [data, setdata] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});

  // State for Create Admin Modal
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminData, setCreateAdminData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [createAdminErrors, setCreateAdminErrors] = useState({});
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const availableRoles = [
    'customer',
    'inventory_admin',
    'support_admin',
    'order_admin',
    'content_admin',
    'super_admin',
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch platform stats for analytics
      const statsResponse = await adminService.getPlatformStats();
      console.log('Platform Stats Response:', statsResponse);
      
      if (statsResponse.success) {
        const stats = statsResponse.data;
        
        // Transform backend data to analytics format
        const analyticsData = {
          totalUsers: stats.users?.length || 0,
          totalOrders: stats.orders?.totalOrders || 0,
          totalPlants: stats.products?.totalProducts || 0,
          totalRevenue: stats.revenue?.totalRevenue || 0,
          ordersByStatus: {
            confirmed: stats.orders?.ordersByStatus?.confirmed || 0,
            processing: stats.orders?.ordersByStatus?.processing || 0,
            packing: stats.orders?.ordersByStatus?.packed || 0,
            shipped: stats.orders?.ordersByStatus?.shipped || 0,
            outForDelivery: stats.orders?.ordersByStatus?.out_for_delivery || 0,
            delivered: stats.orders?.ordersByStatus?.delivered || 0,
            cancelled: stats.orders?.ordersByStatus?.cancelled || 0,
          },
        };
        setAnalytics(analyticsData);
      }

      // Fetch users data from /users/admin/users endpoint
      const usersResponse = await adminService.listAllUsers();
        console.log('Users Response:', usersResponse);

        if (usersResponse.success && usersResponse.users?.length > 0) {
          // Fetch all profiles in parallel
          const profiles = await Promise.all(
            usersResponse.users.map(async (user) => {
              try {
                const profileResponse = await profileService.getAdminProfile(user.id); 
                console.log('Profile Response:', profileResponse);

                if (profileResponse.success && profileResponse.user?.profile) {
                  const profile = profileResponse.user.profile;

                  // Merge the user with relevant profile fields
                  return {
                    ...user,
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    mobile_number: profile.mobile_number || '',
                    avatar_url: profile.avatar_url || null,
                    permanent_address: profile.permanent_address || '',
                  };
                }
              } catch (error) {
                console.error(`Error fetching profile for user ${user.id}:`, error);
              }

              // fallback if no profile found or error
              return { ...user, first_name: 'N/A', last_name: '' };
            })
          );

          // Filter out any null values just in case
          const combinedUsers = profiles.filter(Boolean);
          
          // Set merged data in state
          setUsers(combinedUsers);

          // Initialize selected roles
          const rolesMap = {};
          combinedUsers.forEach(user => {
            rolesMap[user.id] = user.role || 'customer';
          });
          setSelectedRoles(rolesMap);

          console.log('Combined Users:', combinedUsers);
        } else {
          console.warn('No users found in response');
        }


      // Fetch orders from super admin endpoint
      const ordersResponse = await adminService.getAllOrders();
      console.log('Orders Response:', ordersResponse);
      
      if (ordersResponse.success && ordersResponse.data) {
        setOrders(ordersResponse.data.data);
      }

      // Fetch tickets from support admin endpoint
      const ticketsResponse = await adminService.getAllTickets();
      console.log('Tickets Response:', ticketsResponse);
      
      if (ticketsResponse.success && ticketsResponse.tickets) {
          // Extract ticket array and count properly
          const ticketsData = ticketsResponse.tickets.tickets || [];
          const totalCount = ticketsResponse.tickets.count || ticketsData.length;

          console.log('Tickets Data charan:', ticketsData);

          // Set the ticket list
          setTickets(ticketsData);

          // Compute analytics from the tickets array
          const openTickets = ticketsData.filter(t => t.status === 'open').length;
          const inProgressTickets = ticketsData.filter(t => t.status === 'in_progress').length;
          const waitingTickets = ticketsData.filter(t => t.status === 'waiting_customer').length;
          const resolvedTickets = ticketsData.filter(t => t.status === 'closed' || t.status === 'resolved').length;

          const newdata={
            totalTickets: totalCount,
            openTickets,
            resolvedTickets,
            ticketsByStatus: {
              open: openTickets,
              inProgress: inProgressTickets,
              waitingCustomer: waitingTickets,
              resolved: resolvedTickets,
            },
          };
          setdata(newdata);

        }

      // Fetch products from inventory
      const productsResponse = await adminService.getAllProducts();
      console.log('Products Response:', productsResponse);
      
      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const handleDownloadReport = async () => {
  try {
    setDownloadingReport(true);

    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // ========================================
    // HEADER SECTION (Reduced height)
    // ========================================
    doc.setFillColor(45, 80, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Bleaf', 15, 15);

    doc.setFontSize(9);
    doc.setTextColor(232, 245, 233);
    doc.setFont('helvetica', 'italic');
    doc.text('Nature knows the way - just BLeaf, just Blieve', 15, 22);

    // Reset to normal styling
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Report Title
    doc.setFontSize(20);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Super Admin System Report', 15, 42);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated On: ${today}`, 15, 49);

    // Horizontal line
    doc.setDrawColor(45, 80, 22);
    doc.setLineWidth(0.8);
    doc.line(15, 54, pageWidth - 15, 54);

    let yPosition = 64;

    // ========================================
    // EXECUTIVE SUMMARY
    // ========================================
    doc.setFontSize(14);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 15, yPosition);
    yPosition += 8;

    // Summary boxes
    const summaryData = [
      { label: 'Total Users', value: analytics?.totalUsers || 0},
      { label: 'Total Orders', value: analytics?.totalOrders || 0 },
      { label: 'Total Products', value: analytics?.totalPlants || 0 },
      { label: 'Total Revenue', value: `Rs.${(analytics?.totalRevenue || 0).toLocaleString()}` },
      { label: 'Open Tickets', value: data?.openTickets || 0 },
      { label: 'Resolved Tickets', value: data?.resolvedTickets || 0 },
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData.map(item => [item.label, item.value]),
      theme: 'grid',
      headStyles: { 
        fillColor: [45, 80, 22], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { halign: 'right', fontStyle: 'bold', textColor: [45, 80, 22] }
      },
      margin: { left: 15, right: 15 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ========================================
    // USER STATISTICS
    // ========================================
    doc.setFontSize(14);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('User Statistics', 15, yPosition);
    yPosition += 8;

    // Count users by role
    const roleCounts = users.reduce((acc, user) => {
      const role = user.role || 'customer';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const userRoleData = Object.entries(roleCounts).map(([role, count]) => [
      role.replace('_', ' ').toUpperCase(),
      count
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['User Role', 'Count']],
      body: [
        ['TOTAL USERS', analytics?.totalUsers || 0],
        ...userRoleData
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [45, 80, 22], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [45, 80, 22];
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Check if new page needed
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // ========================================
    // ORDER ANALYTICS
    // ========================================
    doc.setFontSize(14);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Analytics & Breakdown', 15, yPosition);
    yPosition += 8;

    const orderStatusData = [
      ['Total Orders', analytics?.totalOrders || 0],
      ['Confirmed', analytics?.ordersByStatus?.confirmed || 0],
      ['Processing', analytics?.ordersByStatus?.processing || 0],
      ['Packing', analytics?.ordersByStatus?.packing || 0],
      ['Shipped', analytics?.ordersByStatus?.shipped || 0],
      ['Out for Delivery', analytics?.ordersByStatus?.outForDelivery || 0],
      ['Delivered', analytics?.ordersByStatus?.delivered || 0],
      ['Cancelled', analytics?.ordersByStatus?.cancelled || 0],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Order Status', 'Count']],
      body: orderStatusData,
      theme: 'grid',
      headStyles: { 
        fillColor: [45, 80, 22], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [45, 80, 22];
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Check if new page needed
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // ========================================
    // INVENTORY OVERVIEW
    // ========================================
    doc.setFontSize(14);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory Overview', 15, yPosition);
    yPosition += 8;

    const inStockCount = products.filter(p => (p.stock_quantity || p.stock || 0) > 30).length;
    const lowStockCount = products.filter(p => {
      const stock = p.stock_quantity || p.stock || 0;
      return stock > 0 && stock <= 30;
    }).length;
    const outOfStockCount = products.filter(p => (p.stock_quantity || p.stock || 0) === 0).length;

    const inventoryData = [
      ['Total Products', products.length || 0],
      ['In Stock (>30)', inStockCount],
      ['Low Stock (1-30)', lowStockCount],
      ['Out of Stock', outOfStockCount],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Inventory Status', 'Count']],
      body: inventoryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [45, 80, 22], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [45, 80, 22];
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Check if new page needed
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    // ========================================
    // PRODUCT INVENTORY DETAILS
    // ========================================
    doc.setFontSize(14);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Product Inventory', 15, yPosition);
    yPosition += 8;

    const productRows = products.slice(0, 50).map(p => [
      p.name || p.product_name || 'N/A',
      p.category_name || 'N/A',
      `Rs.${(p.price || p.base_price || 0).toFixed(2)}`,
      (p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0)),
      (p.stock_quantity || p.stock || 0) === 0 ? 'Out' : 
        (p.stock_quantity || p.stock || 0) <= 30 ? 'Low' : 'Good'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Product Name', 'Category', 'Price', 'Stock', 'Status']],
      body: productRows.length > 0 ? productRows : [['No products available', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { 
        fillColor: [45, 80, 22], 
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25, fontSize: 7 }
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.text[0] === 'Out') {
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Low') {
            data.cell.styles.textColor = [255, 193, 7];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'Good') {
            data.cell.styles.textColor = [40, 167, 69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    if (products.length > 50) {
      yPosition = doc.lastAutoTable.finalY + 5;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Note: Showing first 50 of ${products.length} products`, 15, yPosition);
    }

    yPosition = doc.lastAutoTable.finalY + 15;

    // Check if new page needed
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // ========================================
    // SUPPORT TICKET ANALYTICS
    // ========================================
    doc.setFontSize(14);
    doc.setTextColor(45, 80, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Support Ticket Metrics', 15, yPosition);
    yPosition += 8;

    const ticketStatusData = [
      ['Total Tickets', data?.totalTickets || 0],
      ['Open', data?.ticketsByStatus?.open || 0],
      ['In Progress', data?.ticketsByStatus?.inProgress || 0],
      ['Waiting Customer', data?.ticketsByStatus?.waitingCustomer || 0],
      ['Resolved/Closed', data?.ticketsByStatus?.resolved || 0],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Ticket Status', 'Count']],
      body: ticketStatusData,
      theme: 'grid',
      headStyles: { 
        fillColor: [45, 80, 22], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [45, 80, 22];
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ========================================
    // FOOTER
    // ========================================
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      
      doc.text(
        'Generated by BLeaf Super Admin Dashboard',
        15,
        pageHeight - 12
      );
      
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      );
      
      doc.text(
        `Report Date: ${today}`,
        pageWidth - 15,
        pageHeight - 12,
        { align: 'right' }
      );
    }

    // Save PDF
    const filename = `BLeaf_SuperAdmin_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error generating report:', error);
    alert('Failed to generate report. Please try again.');
  } finally {
    setDownloadingReport(false);
  }
};

  const handleRoleChange = (userId, newRole) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  const handleUpdateRole = async (userId) => {
    try {
      const newRole = selectedRoles[userId];
      const response = await adminService.updateUserRole(userId, newRole);
      
      if (response.success) {
        // Update local state
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );

        alert(response.message || 'Role updated successfully!');
      } else {
        alert(response.message || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role. Please try again.');
    }
  };

  // Create Admin Handlers
  const handleCreateAdminChange = (e) => {
    const { name, value } = e.target;
    setCreateAdminData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (createAdminErrors[name]) {
      setCreateAdminErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCreateAdmin = () => {
    const errors = {};
    
    // Email validation
    if (!createAdminData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createAdminData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!createAdminData.password) {
      errors.password = 'Password is required';
    } else if (createAdminData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(createAdminData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (!createAdminData.confirmPassword) {
      errors.confirmPassword = 'Please confirm the password';
    } else if (createAdminData.password !== createAdminData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!createAdminData.role) {
      errors.role = 'Please select a role';
    }

    return errors;
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateCreateAdmin();
    if (Object.keys(errors).length > 0) {
      setCreateAdminErrors(errors);
      return;
    }

    setCreatingAdmin(true);
    setCreateAdminErrors({});

    try {
      const response = await authService.createAdmin(
        createAdminData.email,
        createAdminData.password,
        createAdminData.role
      );

      if (response.success) {
        // Show success message
        alert(`Admin account created successfully!\nEmail: ${response.data.email}\nRole: ${response.data.role}`);
        
        // Reset form
        setCreateAdminData({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin'
        });
        
        // Close modal
        setShowCreateAdminModal(false);
        
        // Reload users list to show the new admin
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setCreateAdminErrors({
        submit: error.message || 'Failed to create admin account. Please try again.'
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCloseCreateAdminModal = () => {
    setShowCreateAdminModal(false);
    setCreateAdminData({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin'
    });
    setCreateAdminErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Chart data configurations
  const ordersChartData = analytics ? {
    labels: ['Confirmed', 'Processing', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    datasets: [
      {
        label: 'Orders',
        data: [
          analytics.ordersByStatus.confirmed,
          analytics.ordersByStatus.processing,
          analytics.ordersByStatus.packing,
          analytics.ordersByStatus.shipped,
          analytics.ordersByStatus.outForDelivery,
          analytics.ordersByStatus.delivered,
          analytics.ordersByStatus.cancelled,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(46, 204, 113, 0.6)',
          'rgba(231, 76, 60, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(231, 76, 60, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const ticketsChartData = data ? {
    labels: ['Open', 'In Progress', 'Waiting Customer', 'Resolved'],
    datasets: [
      {
        label: 'Tickets',
        data: [
          data.ticketsByStatus.open,
          data.ticketsByStatus.inProgress,
          data.ticketsByStatus.waitingCustomer,
          data.ticketsByStatus.resolved,
        ],
        backgroundColor: [
          'rgba(231, 76, 60, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(52, 152, 219, 0.6)',
          'rgba(46, 204, 113, 0.6)',
        ],
        borderColor: [
          'rgba(231, 76, 60, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 className="mb-1">
            <i className="bi bi-shield-check text-danger me-2"></i>
            Super Admin Dashboard
          </h2>
          <p className="text-muted">Complete system overview and management control</p>
        </div>
        <div className="col-md-4 text-end d-flex align-items-center justify-content-end">
          <button
            className="btn btn-success"
            onClick={handleDownloadReport}
            disabled={downloadingReport || loading}
          >
            {downloadingReport ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Generating Report...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Download Report (PDF)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-speedometer2 me-1"></i>
            Overview & Analytics
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-1"></i>
            Role Management
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="bi bi-cart-check me-1"></i>
            Orders
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <i className="bi bi-box-seam me-1"></i>
            Inventory
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <i className="bi bi-headset me-1"></i>
            Support
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4 col-lg-2">
              <div className="card shadow-sm h-100 border-start border-primary border-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1 small">Total Users</h6>
                      <h3 className="mb-0 fw-bold">{analytics?.totalUsers }</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                      <i className="bi bi-people fs-4 text-primary"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4 col-lg-2">
              <div className="card shadow-sm h-100 border-start border-success border-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1 small">Total Orders</h6>
                      <h3 className="mb-0 fw-bold">{analytics?.totalOrders || 0}</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                      <i className="bi bi-cart-check fs-4 text-success"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4 col-lg-2">
              <div className="card shadow-sm h-100 border-start border-warning border-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1 small">Total Plants</h6>
                      <h3 className="mb-0 fw-bold">{analytics?.totalPlants || 0}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                      <i className="bi bi-flower1 fs-4 text-warning"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm h-100 border-start border-danger border-4">
                <div className="card-body">
                  <h6 className="text-muted mb-2 small">Support Tickets</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 fw-bold">{data?.totalTickets || 0}</h3>
                      <small className="text-muted">
                        <span className="badge bg-danger me-1">{data?.openTickets || 0}</span>
                        Open |
                        <span className="badge bg-success ms-1">{data?.resolvedTickets || 0}</span>
                        Resolved
                      </small>
                    </div>
                    <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                      <i className="bi bi-ticket-detailed fs-4 text-danger"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm h-100 border-start border-info border-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1 small">Total Revenue</h6>
                      <h3 className="mb-0 fw-bold">₹{analytics?.totalRevenue?.toLocaleString() || 0}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                      <i className="bi bi-currency-rupee fs-4 text-info"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-bar-chart-fill text-primary me-2"></i>
                    Orders by Status
                  </h5>
                </div>
                <div className="card-body">
                  {ordersChartData && (
                    <Bar data={ordersChartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-pie-chart-fill text-danger me-2"></i>
                    Ticket Bifurcation
                  </h5>
                </div>
                <div className="card-body">
                  {ticketsChartData && (
                    <Doughnut data={ticketsChartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Modules */}
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-shield-lock text-danger me-2"></i>
                    System Management
                  </h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <button
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      onClick={() => setActiveTab('users')}
                    >
                      <i className="bi bi-people-fill me-3 text-primary"></i>
                      <div>
                        <div className="fw-bold">User & Role Management</div>
                        <small className="text-muted">Manage user roles and permissions</small>
                      </div>
                    </button>
                    <button
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      onClick={() => navigate('/admin/system/activitylogs')}
                    >
                      <i className="bi bi-clock-history me-3 text-warning"></i>
                      <div>
                        <div className="fw-bold">Activity Logs</div>
                        <small className="text-muted">View system activity and audit trails</small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-grid-3x3-gap-fill text-success me-2"></i>
                    All Admin Modules
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-6">
                      <button
                        className="btn btn-outline-primary w-100 text-start"
                        onClick={() => setActiveTab('inventory')}
                      >
                        <i className="bi bi-box-seam me-2"></i>
                        Inventory
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className="btn btn-outline-success w-100 text-start"
                        onClick={() => setActiveTab('orders')}
                      >
                        <i className="bi bi-cart-check me-2"></i>
                        Orders
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className="btn btn-outline-danger w-100 text-start"
                        onClick={() => setActiveTab('support')}
                      >
                        <i className="bi bi-headset me-2"></i>
                        Support
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className="btn btn-outline-warning w-100 text-start"
                        onClick={() => navigate('/admin/content')}
                      >
                        <i className="bi bi-file-text me-2"></i>
                        Content
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-shield-lock text-danger me-2"></i>
                  User Role Management
                </h5>
                <small className="text-muted">Assign and manage admin roles for users</small>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateAdminModal(true)}
              >
                <i className="bi bi-person-plus-fill me-2"></i>
                Create Admin Account
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>New Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users && users.length > 0 ? users.map(user => (
                      <tr key={user.id || user.user_id}>
                        <td>#{user.id || user.user_id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                              <i className="bi bi-person-fill text-primary"></i>
                            </div>
                            {user.first_name || user.full_name || 'N/A'}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge bg-${
                            user.role === 'super_admin' ? 'danger' :
                            (user.role && user.role.includes('admin')) ? 'warning' : 'secondary'
                          }`}>
                            {(user.role || 'customer').replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={selectedRoles[user.id || user.user_id] || user.role || 'customer'}
                            onChange={(e) => handleRoleChange(user.id || user.user_id, e.target.value)}
                          >
                            {availableRoles.map(role => (
                              <option key={role} value={role}>
                                {role.replace('_', ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUpdateRole(user.id || user.user_id)}
                            disabled={selectedRoles[user.id || user.user_id] === user.role}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Update Role
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="text-center">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-cart-check text-success me-2"></i>
                  All Orders Management
                </h5>
                <small className="text-muted">View and manage all system orders</small>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/admin/orders')}>
                <i className="bi bi-arrow-right-circle me-1"></i>
                Go to Full Orders Page
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders && orders.length > 0 ? orders.map(order => (
                      <tr key={order.id }>
                        <td><strong>{order.id }</strong></td>
                        <td>
                          <i className="bi bi-person-circle me-2"></i>
                          {order.users.profiles.first_name  || 'N/A'}
                        </td>
                        <td>₹{(order.total || order.total_amount || 0).toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${
                            order.status === 'delivered' ? 'success' :
                            order.status === 'shipped' ? 'info' :
                            order.status === 'processing' ? 'warning' : 'primary'
                          }`}>
                            {(order.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td>{order.date || order.created_at ? new Date(order.date || order.created_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="text-center">No orders found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-box-seam text-warning me-2"></i>
                  Inventory Management
                </h5>
                <small className="text-muted">View and manage all products in the system</small>
              </div>
              <button className="btn btn-sm btn-warning" onClick={() => navigate('/admin/inventory')}>
                <i className="bi bi-arrow-right-circle me-1"></i>
                Go to Full Inventory Page
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products && products.length > 0 ? (
                        products.map(product => (
                          <tr key={product.id || product.product_id}>
                            <td><strong>#{product.id || product.product_id}</strong></td>
                            <td>
                              <i className="bi bi-flower1 me-2 text-success"></i>
                              {product.name || product.product_name}
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {product.category || product.category_name || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  (product.stock || product.stock_quantity || 0) < 30
                                    ? 'bg-danger'
                                    : 'bg-success'
                                }`}
                              >
                                {product.stock || product.stock_quantity || 0} units
                              </span>
                            </td>
                            <td>₹{product.price || product.base_price || 0}</td>
                            <td>
                              <span className="badge bg-success">
                                {(product.status || product.is_active ? 'ACTIVE' : 'INACTIVE').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No products found
                          </td>
                        </tr>
                      )}

                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div>
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-headset text-danger me-2"></i>
                  Support Ticket Management
                </h5>
                <small className="text-muted">View and manage all support tickets</small>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => navigate('/admin/support')}>
                <i className="bi bi-arrow-right-circle me-1"></i>
                Go to Full Support Page
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Ticket ID</th>
                      <th>Subject</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets && tickets.length > 0 ? (
                        tickets.map(ticket => (
                          <tr key={ticket.id || ticket.ticket_id}>
                            <td><strong>{ticket.ticket_number || ticket.id}</strong></td>
                            <td>{ticket.subject || ticket.title || 'N/A'}</td>
                            <td>
                              <i className="bi bi-person-circle me-2"></i>
                              {ticket.customer || ticket.customer_name || ticket.user_name || 'N/A'}
                            </td>
                            <td>
                              <span
                                className={`badge bg-${
                                  ticket.status === 'resolved' || ticket.status === 'closed'
                                    ? 'success'
                                    : ticket.status === 'inProgress' || ticket.status === 'in_progress'
                                    ? 'warning'
                                    : ticket.status === 'waitingCustomer' || ticket.status === 'waiting_customer'
                                    ? 'info'
                                    : 'danger'
                                }`}
                              >
                                {ticket.status === 'inProgress' || ticket.status === 'in_progress'
                                  ? 'IN PROGRESS'
                                  : ticket.status === 'waitingCustomer' || ticket.status === 'waiting_customer'
                                  ? 'WAITING CUSTOMER'
                                  : (ticket.status || 'open').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge bg-${
                                  ticket.priority === 'high'
                                    ? 'danger'
                                    : ticket.priority === 'medium'
                                    ? 'warning'
                                    : 'secondary'
                                }`}
                              >
                                {(ticket.priority || 'low').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {ticket.date || ticket.created_at
                                ? new Date(ticket.date || ticket.created_at).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No tickets found
                          </td>
                        </tr>
                      )}

                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div 
          className="modal show d-block" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
          onClick={handleCloseCreateAdminModal}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              {/* Modal Header */}
              <div 
                className="modal-header"
                style={{
                  background: 'linear-gradient(135deg, #2C5F2D 0%, #4A8A4D 100%)',
                  border: 'none',
                  padding: '1.5rem 2rem',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px'
                }}
              >
                <h5 
                  className="modal-title fw-bold d-flex align-items-center" 
                  style={{ color: '#FFFFFF', fontSize: '1.5rem' }}
                >
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Create New Admin Account
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseCreateAdminModal}
                  disabled={creatingAdmin}
                ></button>
              </div>

              {/* Modal Body */}
              <div 
                className="modal-body"
                style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}
              >
                {createAdminErrors.submit && (
                  <div 
                    className="alert alert-danger border-0 mb-4"
                    style={{
                      backgroundColor: '#FFF5F5',
                      color: '#C53030',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {createAdminErrors.submit}
                  </div>
                )}

                <form onSubmit={handleCreateAdminSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label 
                      className="form-label fw-semibold mb-2" 
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span 
                        className="input-group-text"
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRight: 'none',
                          borderRadius: '10px 0 0 10px'
                        }}
                      >
                        <i className="bi bi-envelope-fill" style={{ color: '#6B7B5F' }}></i>
                      </span>
                      <input
                        type="email"
                        name="email"
                        className={`form-control ${createAdminErrors.email ? 'is-invalid' : ''}`}
                        placeholder="admin@example.com"
                        value={createAdminData.email}
                        onChange={handleCreateAdminChange}
                        disabled={creatingAdmin}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderLeft: 'none',
                          borderRadius: '0 10px 10px 0',
                          padding: '0.75rem',
                          color: '#2C5F2D',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    {createAdminErrors.email && (
                      <div className="text-danger small mt-1">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {createAdminErrors.email}
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label 
                      className="form-label fw-semibold mb-2" 
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span 
                        className="input-group-text"
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRight: 'none',
                          borderRadius: '10px 0 0 10px'
                        }}
                      >
                        <i className="bi bi-lock-fill" style={{ color: '#6B7B5F' }}></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className={`form-control ${createAdminErrors.password ? 'is-invalid' : ''}`}
                        placeholder="Enter strong password"
                        value={createAdminData.password}
                        onChange={handleCreateAdminChange}
                        disabled={creatingAdmin}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderLeft: 'none',
                          borderRight: 'none',
                          padding: '0.75rem',
                          color: '#2C5F2D',
                          fontSize: '0.95rem'
                        }}
                      />
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={creatingAdmin}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderLeft: 'none',
                          borderRadius: '0 10px 10px 0',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}-fill`}></i>
                      </button>
                    </div>
                    {createAdminErrors.password && (
                      <div className="text-danger small mt-1">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {createAdminErrors.password}
                      </div>
                    )}
                    <small className="text-muted">
                      Password must be at least 8 characters with uppercase, lowercase, and numbers
                    </small>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="mb-3">
                    <label 
                      className="form-label fw-semibold mb-2" 
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span 
                        className="input-group-text"
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRight: 'none',
                          borderRadius: '10px 0 0 10px'
                        }}
                      >
                        <i className="bi bi-lock-fill" style={{ color: '#6B7B5F' }}></i>
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className={`form-control ${createAdminErrors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Confirm password"
                        value={createAdminData.confirmPassword}
                        onChange={handleCreateAdminChange}
                        disabled={creatingAdmin}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderLeft: 'none',
                          borderRight: 'none',
                          padding: '0.75rem',
                          color: '#2C5F2D',
                          fontSize: '0.95rem'
                        }}
                      />
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={creatingAdmin}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderLeft: 'none',
                          borderRadius: '0 10px 10px 0',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}-fill`}></i>
                      </button>
                    </div>
                    {createAdminErrors.confirmPassword && (
                      <div className="text-danger small mt-1">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {createAdminErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2" 
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Admin Role <span className="text-danger">*</span>
                    </label>
                    <select
                      name="role"
                      className={`form-select ${createAdminErrors.role ? 'is-invalid' : ''}`}
                      value={createAdminData.role}
                      onChange={handleCreateAdminChange}
                      disabled={creatingAdmin}
                      style={{
                        backgroundColor: '#F8F6F1',
                        border: '2px solid #E5E7EB',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        color: '#2C5F2D',
                        fontSize: '0.95rem'
                      }}
                    >
                      
                      <option value="inventory_admin">Inventory Admin</option>
                      <option value="support_admin">Support Admin</option>
                      <option value="order_admin">Order Admin</option>
                      <option value="content_admin">Content Admin</option>
        
                    </select>
                    {createAdminErrors.role && (
                      <div className="text-danger small mt-1">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {createAdminErrors.role}
                      </div>
                    )}
                    <small className="text-muted">
                      Select the appropriate admin role for this user
                    </small>
                  </div>

                  {/* Info Alert */}
                  <div 
                    className="alert border-0 mb-0"
                    style={{
                      backgroundColor: '#FFF9E5',
                      color: '#8B6914',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}
                  >
                    <i className="bi bi-info-circle me-2"></i>
                    <small>
                      The admin will receive login credentials via email. They can change their password after first login.
                    </small>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div 
                className="modal-footer"
                style={{
                  backgroundColor: '#F8F6F1',
                  border: 'none',
                  padding: '1.5rem 2rem',
                  borderBottomLeftRadius: '20px',
                  borderBottomRightRadius: '20px'
                }}
              >
                <button
                  type="button"
                  className="btn fw-semibold"
                  onClick={handleCloseCreateAdminModal}
                  disabled={creatingAdmin}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#6B7B5F',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn fw-bold shadow-sm"
                  onClick={handleCreateAdminSubmit}
                  disabled={creatingAdmin}
                  style={{
                    backgroundColor: creatingAdmin ? '#97C97D' : '#2C5F2D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: creatingAdmin ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {creatingAdmin ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Create Admin Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;