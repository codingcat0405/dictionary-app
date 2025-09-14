import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import DashBoard from '@renderer/pages/admin/tabs/DashBoard'
import Dictionary from '@renderer/pages/admin/tabs/Dictionary'
import Execices from '@renderer/pages/admin/tabs/Execices'
import Curriculum from '@renderer/pages/admin/tabs/Curriculum'
import { ACCESS_TOKEN_KEY } from '@renderer/constants'

const { Header, Content } = Layout

const items = [
  {
    key: 1,
    label: 'Tổng quan'
  },
  {
    key: 2,
    label: 'Từ điển'
  },
  {
    key: 3,
    label: 'Bài tập'
  },
  {
    key: 4,
    label: 'Giáo trình'
  }
]
const AdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState<string>('1')

  useEffect(() => {
    const userString = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '{}'
    if (!userString) {
      navigate('/')
    }
    const { user } = JSON.parse(userString)
    if (user.role !== 'admin') {
      navigate('/')
    }
  }, [navigate])

  const getTabContent = (key: string): React.ReactNode => {
    if (key === '1') {
      return <DashBoard />
    }
    if (key === '2') {
      return <Dictionary />
    }
    if (key === '3') {
      return <Execices />
    }
    if (key === '4') {
      return <Curriculum />
    }
    return <DashBoard />
  }
  return (
    <Layout className="bg-white">
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <Menu
          onClick={(evt) => {
            setActiveTab(evt.key)
          }}
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={items}
        />
      </Header>
      <Content className="bg-white">{getTabContent(activeTab)}</Content>
    </Layout>
  )
}

export default AdminPage
