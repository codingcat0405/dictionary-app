import React from 'react'
import { Button, Dropdown, Image, MenuProps, Space } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { DownOutlined } from '@ant-design/icons'
import { ACCESS_TOKEN_KEY } from '@renderer/constants'
import logo from '../assets/logo.jpg'
const Header: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <Link to="/">Trang chủ</Link>
    },
    {
      key: '2',
      label: <Link to="/admin">Quản trị</Link>
    },
    {
      key: '3',
      label: (
        <div
          onClick={() => {
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            navigate('/')
          }}
        >
          Đăng xuất
        </div>
      )
    }
  ]

  const itemsUser: MenuProps['items'] = [
    {
      key: '1',
      label: <Link to="/">Trang chủ</Link>
    },
    {
      key: '2',
      label: <Link to="/exercise">Bài tập</Link>
    },
    {
      key: '3',
      label: <Link to="/curriculum">Giáo trình</Link>
    },
    {
      key: '4',
      label: (
        <div
          onClick={() => {
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            navigate('/')
          }}
        >
          Đăng xuất
        </div>
      )
    }
  ]
  const userString = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '{}'
  const { user } = JSON.parse(userString)
  return (
    <div className="flex items-center justify-between px-8 bg-blue-400">
      <div onClick={() => navigate('/')} className="cursor-pointer">
        <Image src={logo} preview={false} width={70} />
      </div>
      <div className="text-center text-white">
        <p className="font-bold text-xl">COLLEGE OF CRYPTOGRAPHY TECHNIQUES</p>
        <p>E-DICTIONARY</p>
      </div>
      <div>
        {pathname !== '/login' &&
          (user ? (
            <Dropdown menu={{ items: user.role === 'admin' ? items : itemsUser }}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  {user?.fullName ?? ''}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          ) : (
            <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
          ))}
      </div>
    </div>
  )
}
export default Header
